using InnoviaHub.Models;

namespace InnoviaHub.DTOs
{
    public class BookingDTO
    {
        public int BookingId { get; set; }
        public string UserId { get; set; } = null!;
        public string MemberName { get; set; } = null!;
        public int ResourceId { get; set; }
        public string ResourceName { get; set; } = null!;
        public BookingType BookingType { get; set; }
        public DateTimeOffset StartTime { get; set; }
        public DateTimeOffset EndTime { get; set; }
        public DateTime DateOfBooking { get; set; }
    }
}