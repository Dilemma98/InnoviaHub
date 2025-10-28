using System;
using Backend.Data;
using InnoviaHub.Models;
using System.Linq;

namespace Backend.Data
{
    public class TimeslotsSeeder
    {
        public static void SeedTimeslots(InnoviaHubDB context)
        {
            // Om timeslots redan finns, gör inget
            if (context.Timeslots.Any()) return;

            var resources = context.Resources.ToList();
            var today = DateTime.Today;
            var endDate = today.AddMonths(2);

            var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");

            foreach (var resource in resources)
            {
                var currentDate = today;

                while (currentDate <= endDate)
                {
                    if (currentDate.DayOfWeek != DayOfWeek.Saturday &&
                        currentDate.DayOfWeek != DayOfWeek.Sunday)
                    {
                        for (int hour = 8; hour < 18; hour += 2)
                        {
                            // Skapa start och end i svensk tid, utan Kind
                            var localStart = new DateTime(currentDate.Year, currentDate.Month, currentDate.Day, hour, 0, 0, DateTimeKind.Unspecified);
                            var localEnd = localStart.AddHours(2);


                            context.Timeslots.Add(new Timeslot
                            {
                                ResourceId = resource.ResourceId,
                                StartTime = TimeZoneInfo.ConvertTimeToUtc(localStart, tz), // konvertera en gång
                                EndTime = TimeZoneInfo.ConvertTimeToUtc(localEnd, tz),
                                IsBooked = false
                            });
                        }
                    }

                    currentDate = currentDate.AddDays(1);
                }
            }

            context.SaveChanges();
        }
    }
}
