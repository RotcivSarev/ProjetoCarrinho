namespace ShoppingCartApi.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}