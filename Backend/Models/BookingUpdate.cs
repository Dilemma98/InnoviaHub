namespace InnoviaHub.Models
{
    public class BookingUpdate
    {
        public int ResourceId { get; set; }
        public int BookingId { get; set; }
        public string Date { get; set; } = null!;
        public DateTimeOffset Start { get; set; }
        public DateTimeOffset End { get; set; }
    }
}
