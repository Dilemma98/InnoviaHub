using InnoviaHub.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using InnoviaHub.DTOs;

namespace Backend.Services;
public class VirtualAssistantService
{
    // Dependency injection of the database context
    private readonly InnoviaHubDB _context;
    public VirtualAssistantService(InnoviaHubDB context)
    {
        _context = context;
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
}