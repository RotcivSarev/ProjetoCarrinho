const API_URL = "http://localhost:5183/api/cart";
let cart = [];
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    document.getElementById('delivery-date').min = new Date().toISOString().split('T')[0];
    addPaymentField();
});

async function fetchProducts() {
    try {
        console.log('Buscando produtos em:', `${API_URL}/products`);
        const response = await fetch(`${API_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        products = await response.json();
        console.log('Produtos recebidos:', products.length);
        
        renderProducts();
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        document.getElementById('product-list').innerHTML = 
            `<p style="color:red;">Erro: ${error.message}<br>
            Verifique se a API está rodando em http://localhost:5183</p>`;
    }
}

function renderProducts() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    
    if (products.length === 0) {
        list.innerHTML = '<p>Nenhum produto disponível.</p>';
        return;
    }
    
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <div>
                <strong>${p.name}</strong><br>
                <small>Estoque: ${p.stock} | Preço: R$ ${p.price.toFixed(2)}</small>
            </div>
            <button onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled style="background-color:#ccc;"' : ''}>
                ${p.stock <= 0 ? 'Esgotado' : 'Adicionar'}
            </button>
        `;
        list.appendChild(div);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        alert("Produto esgotado!");
        return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert("Quantidade máxima em estoque atingida!");
            return;
        }
    } else {
        cart.push({ productId: product.id, quantity: 1, price: product.price, name: product.name });
    }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const checkoutArea = document.getElementById('checkout-area');
    
    if (cart.length === 0) {
        container.innerHTML = "Seu carrinho está vazio.";
        checkoutArea.classList.add('hidden');
        return;
    }

    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <div>${item.name} (x${item.quantity})</div>
            <div>
                R$ ${itemTotal.toFixed(2)}
                <button class="remove" onclick="removeFromCart(${item.productId})" style="margin-left:5px; padding: 2px 5px;">X</button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('total-display').innerText = `Total: R$ ${total.toFixed(2)}`;
    checkoutArea.classList.remove('hidden');
    validatePayments(total);
}

function addPaymentField() {
    const container = document.getElementById('payments-container');
    const div = document.createElement('div');
    div.className = 'payment-row';
    div.innerHTML = `
        <select class="pay-type">
            <option value="Credit">Crédito</option>
            <option value="Debit">Débito</option>
            <option value="Pix">PIX</option>
        </select>
        <input type="number" class="pay-amount" placeholder="Valor R$" step="0.01" oninput="validatePayments()">
        <button type="button" class="remove" onclick="this.parentElement.remove(); validatePayments()">Remover</button>
    `;
    container.appendChild(div);
}

function getPayments() {
    const rows = document.querySelectorAll('.payment-row');
    const payments = [];
    rows.forEach(row => {
        const type = row.querySelector('.pay-type').value;
        const amount = parseFloat(row.querySelector('.pay-amount').value) || 0;
        if (amount > 0) payments.push({ type, amount });
    });
    return payments;
}

function validatePayments(totalOrder = null) {
    if (totalOrder === null) {
        totalOrder = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }
    
    const payments = getPayments();
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    
    const display = document.getElementById('total-display');
    if (Math.abs(totalPaid - totalOrder) > 0.01) {
        display.style.color = 'red';
        display.innerText = `Total: R$ ${totalOrder.toFixed(2)} | Pago: R$ ${totalPaid.toFixed(2)} ❌`;
        return false;
    } else if (totalPaid > 0) {
        display.style.color = 'green';
        display.innerText = `Total: R$ ${totalOrder.toFixed(2)} ✅`;
        return true;
    }
    return false;
}

async function finalizeOrder() {
    const deliveryDate = document.getElementById('delivery-date').value;
    const totalOrder = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const payments = getPayments();
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    if (!deliveryDate) {
        alert("Por favor, selecione uma data de entrega.");
        return;
    }
    if (Math.abs(totalPaid - totalOrder) > 0.01) {
        alert(`Valores divergentes!\nTotal: R$ ${totalOrder.toFixed(2)}\nPago: R$ ${totalPaid.toFixed(2)}`);
        return;
    }

    const payload = {
        items: cart,
        deliveryDate: deliveryDate,
        payments: payments
    };

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            result = await response.json();
        } else {
            result = { message: await response.text() };
        }

        if (response.ok) {
            alert(result.message || result.Message || "Compra realizada com sucesso!");
            cart = [];
            renderCart();
            document.getElementById('payments-container').innerHTML = '';
            addPaymentField();
            fetchProducts();
        } else {
            alert("Erro: " + (result.message || result.Message || "Falha na compra"));
        }
    } catch (error) {
        alert("Erro de conexão com a API.");
        console.error('Erro:', error);
    }
}