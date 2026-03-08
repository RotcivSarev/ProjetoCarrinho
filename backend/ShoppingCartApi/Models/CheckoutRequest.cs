namespace ShoppingCartApi.Models
{
    public class CheckoutRequest
    {
        public List<CartItem> Items { get; set; } = new();  
        public DateTime DeliveryDate { get; set; }
        public List<Payment> Payments { get; set; } = new();  
    }
}