using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShoppingCartApi.Data;
using ShoppingCartApi.Models;

namespace ShoppingCartApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        
        [HttpGet("products")]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.ToListAsync();
        }

  
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            if (request.DeliveryDate <= DateTime.Now)
                return BadRequest("A data de entrega deve ser futura.");

            decimal totalOrder = 0;
            var itemsToProcess = new List<CartItem>();

            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null) return NotFound($"Produto {item.ProductId} não encontrado.");
                if (product.Stock < item.Quantity) return BadRequest($"Estoque insuficiente: {product.Name}");

                totalOrder += product.Price * item.Quantity;
                itemsToProcess.Add(item);
            }

            if (request.Payments == null || !request.Payments.Any())
                return BadRequest("Informe pelo menos um pagamento.");

            decimal totalPaid = request.Payments.Sum(p => p.Amount);
            if (Math.Abs(totalPaid - totalOrder) > 0.01m)
                return BadRequest($"Valores divergentes. Pedido: {totalOrder}, Pago: {totalPaid}");

            foreach (var item in itemsToProcess)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                product.Stock -= item.Quantity;
            }

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Compra realizada!", Total = totalOrder });
        }
    }
}//http://127.0.0.1:5500/ProjetoCarrinho/frontend/index.html