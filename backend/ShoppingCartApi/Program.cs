using Microsoft.EntityFrameworkCore;
using ShoppingCartApi.Data;
using ShoppingCartApi.Models;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("ShoppingDb"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    dbContext.Database.EnsureCreated();
    
    if (!dbContext.Products.Any())
    {
        dbContext.Products.AddRange(
            new Product { Id = 1, Name = "Smartphone X", Price = 2000.00m, Stock = 10 },
            new Product { Id = 2, Name = "Fone Bluetooth", Price = 150.00m, Stock = 50 },
            new Product { Id = 3, Name = "Capinha Protetora", Price = 50.00m, Stock = 100 }
        );
        dbContext.SaveChanges();
        Console.WriteLine("PRODUTOS INSERIDOS NO BANCO");
    }
    else
    {
        Console.WriteLine($" {dbContext.Products.Count()} produtos já existem no banco.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();