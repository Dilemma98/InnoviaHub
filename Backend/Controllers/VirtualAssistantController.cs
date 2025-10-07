using Backend.Data;
using Backend.Services;
using InnoviaHub.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VirtualAssistantController : ControllerBase
    {
        // Dependency injection of the database context and service
        // No signlarR hub needed here
        private readonly InnoviaHubDB _context;
        private readonly VirtualAssistantService _virtualAssistantService;


        public VirtualAssistantController(InnoviaHubDB context, VirtualAssistantService virtualAssistantService, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _virtualAssistantService = virtualAssistantService;
        }

        [HttpGet("user/{userId}")]
        public ActionResult<List<Booking>> GetBookingsByUser(string userId)
        {
            var bookings = _virtualAssistantService.GetBookingsByUser(userId);
            return Ok(bookings);
        }

         // Define a record type to represent the booking action request
        public record AiBookingAction(string UserId, DateTimeOffset StartTime, DateTimeOffset EndTime);

        [HttpPost]
        // Use the AiBookingAction record to receive the booking request details
        // from the client
        public async Task<IActionResult> BookingRequest([FromBody] AiBookingAction action)
        {
            // Await the AI response from the service
            // and return it to the client
            var answer = await _virtualAssistantService.AiBookingResponse(
                action.UserId,
                action.StartTime,
                action.EndTime
            );
            
            return Ok(new { message = answer });
        }
    }
}
