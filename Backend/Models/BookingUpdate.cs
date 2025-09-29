namespace InnoviaHub.Models
{
    public class BookingUpdate
    {
        public int ResourceId { get; set; }
        public int BookingId { get; set; }
        public string Date { get; set; } = null!;
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }
}
