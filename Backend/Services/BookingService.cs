using InnoviaHub.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using InnoviaHub.DTOs;

namespace Backend.Services;

public class BookingService
{
    private readonly InnoviaHubDB _context;

    public BookingService(InnoviaHubDB context)
    {
        _context = context;
    }

    // Create a booking and mark corresponding timeslot as booked
    public Booking CreateBooking(Booking booking)
    {
        // Set booking date/time
        booking.DateOfBooking = DateTime.Now;

        // Add booking to database
        _context.Bookings.Add(booking);

        // Find and mark the corresponding timeslot as booked
        var timeslot = _context.Timeslots
            .FirstOrDefault(ts => ts.ResourceId == booking.ResourceId
                && ts.StartTime == booking.StartTime
                && ts.EndTime == booking.EndTime);

        if (timeslot != null)
        {
            timeslot.IsBooked = true;
        }

        _context.SaveChanges();
        return booking;
    }

    public List<BookingDTO> GetBookingsByUser(string userId)
    {
          return _context.Bookings
        .Include(b => b.Resource)
        .Where(b => b.UserId == userId)
        .Select(b => new BookingDTO
        {
            BookingId = b.BookingId,
            UserId = b.UserId,
            ResourceId = b.ResourceId,
            ResourceName = b.Resource != null ? b.Resource.ResourceName : "Unknown",
            BookingType = b.BookingType,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            DateOfBooking = b.DateOfBooking
        })
        .ToList();
    }

    public bool IsBookingAvailable(int resourceId, DateTimeOffset startTime, DateTimeOffset endTime)
    {
        var bookingForResource = _context.Bookings.Where(b => b.ResourceId == resourceId);
        var bookingsOverlap = bookingForResource.Any(b => startTime < b.EndTime && endTime > b.StartTime);
        return !bookingsOverlap;
    }

    public List<Booking> GetAllBookings()
    {
        return _context.Bookings
            .Include(b => b.Resource)
            .Include(b => b.User)
            .ToList();
    }

    public bool UpdateBooking(int id, Booking updatedBooking)
    {
        var existingBooking = _context.Bookings.FirstOrDefault(b => b.BookingId == id);
        if (existingBooking == null)
            return false;

        existingBooking.UserId = updatedBooking.UserId;
        existingBooking.ResourceId = updatedBooking.ResourceId;
        existingBooking.StartTime = updatedBooking.StartTime;
        existingBooking.EndTime = updatedBooking.EndTime;
        existingBooking.BookingType = updatedBooking.BookingType;

        _context.SaveChanges();
        return true;
    }

    public bool DeleteBooking(int bookingId)
    {
        var booking = _context.Bookings.FirstOrDefault(b => b.BookingId == bookingId);
        if (booking != null)
        {
            _context.Bookings.Remove(booking);

            // Unmark the timeslot as booked when booking is deleted
            var timeslot = _context.Timeslots
                .FirstOrDefault(ts => ts.ResourceId == booking.ResourceId
                    && ts.StartTime <= booking.StartTime && ts.EndTime >= booking.EndTime);

            if (timeslot != null)
            {
                timeslot.IsBooked = false;
            }

            _context.SaveChanges();
            return true;
        }
        return false;
    }

}