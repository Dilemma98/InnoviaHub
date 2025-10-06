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

        public VirtualAssistantController(InnoviaHubDB context, VirtualAssistantService virtualAssistantService)
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

    }
}
