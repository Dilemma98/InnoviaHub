using Backend.Data;
using Microsoft.EntityFrameworkCore;
using InnoviaHub.DTOs;
using System.Text.Json;

namespace Backend.Services;

public class VirtualAssistantService
{
    // Dependency injection of the database context
    private readonly InnoviaHubDB _context;
    // Dependency injection of HttpClientFactory for making external HTTP requests
    private readonly IHttpClientFactory _httpClientFactory;
    public VirtualAssistantService(InnoviaHubDB context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

    // Method to get Bookings by userId
    public List<BookingDTO> GetBookingsByUser(string userId)
    {
        // Add variable 'now' to represent the current date and time
        // Use 'now' to filter out past bookings
        var now = DateTimeOffset.Now;

        return _context.Bookings
        .Include(b => b.Resource)
        // Filter bookings for the specific user and only include those
        // that have not tey ended. Ongoing and future bookings.
        .Where(b => b.UserId == userId && b.EndTime >= now)
        .Select(b => new BookingDTO
        {
            BookingId = b.BookingId,
            UserId = b.UserId,
            MemberName = b.User.FirstName + " " + b.User.LastName,
            ResourceId = b.ResourceId,
            ResourceName = b.Resource != null ? b.Resource.ResourceName : "Unknown",
            BookingType = b.BookingType,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            DateOfBooking = b.DateOfBooking
        })
        .ToList();
    }

    // Using the record type AiBookingAction defined in the controller
    // to receive the booking request details from the client
    public async Task<string> AiBookingResponse(string userId, DateTimeOffset startTime, DateTimeOffset endTime)
    {
        // Create an HttpClient instance using the factory
        var httpClient = _httpClientFactory.CreateClient("OpenAI");

        // Create reference of users existing bookings
        // to send to AI for context
        var existingBookings = GetBookingsByUser(userId);

        // existingBookings is a list of BookingDTO
        // Convert to a formatted string for the AI prompt
        var bookingInfo = string.Join("\n", existingBookings.Select(b =>
            $"- From {b.StartTime:yyyy-MM-dd HH:mm} to {b.EndTime:yyyy-MM-dd HH:mm}"
        ));

        // Create the request payload
        // according to OpenAI´s API documentation
        var body = new
        {
            model = "gpt-4.1",
            input = new object[]
            {
                // Set prompt for the AI
                
                // Sending users existing bookings for context
                // so it can check for conflicts
                new {
                        role = "system",
                        content = $@"Du är en hjälpsam assistent för användarna av InnoviaHub.
                                Ditt uppdrag är att hjälpa användare att undvika att dubbelboka sig själva på olika resurser samtidigt.
                                Om en användare försöker boka en resurs som krockar med en redan befintlig bokning, svara på ett vänligt och humoristiskt sätt och fråga om användaren ändå vill gå vidare med bokningen.
                                Om det inte finns någon krock, svara kort och glatt med något i stil med: 'Fint som snus hörredu, inga krockar!'.
                                Bokningen ska inte innehålla några datum eller tider i ditt svar.
                                Användaren har följande befintliga bokningar:
                                {bookingInfo}. Ge ett relativt kort och snabbläst svar"
                    },

                    // Set users booking request
                    new {
                        role = "user",
                        content = $"User {userId} is trying to book a resource from {startTime:yyyy-MM-dd HH:mm} to {endTime:yyyy-MM-dd HH:mm}. "
                    }
            }
        };

        // Serialize the payload to JSON and send the POST request
        var content = new StringContent(JsonSerializer.Serialize(body), System.Text.Encoding.UTF8, "application/json");

        // Send post endpiont to OpenAI´s endpoint 'responses'
        var response = await httpClient.PostAsync("responses", content);

        // Read answer as string
        var raw = await response.Content.ReadAsStringAsync();
        Console.WriteLine("RAW AI RESPONSE:", raw);

        // Parse the JSON response to extract the AI's message
        var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;

        // Fetch the AI-generated answer from the response and convert it to string
        // If no answer, return error message
        string answer = root.GetProperty("output")
                .EnumerateArray()
                .FirstOrDefault()
                .GetProperty("content")
                .EnumerateArray()
                .FirstOrDefault()
                .GetProperty("text")
                .GetString()
                ?? "Error: No response from AI";

        return answer;

    }
}