using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using DotNetEnv;

namespace Backend.Data
{
    public class InnoviaHubDbContextFactory : IDesignTimeDbContextFactory<InnoviaHubDB>
    {
        public InnoviaHubDB CreateDbContext(string[] args)
        {
            // Load environment variables from .env file
            Env.Load();

            var connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTIONSTRING");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new Exception("Connection string 'AZURE_SQL_CONNECTIONSTRING' is missing.");
            }

            var optionsBuilder = new DbContextOptionsBuilder<InnoviaHubDB>();
            optionsBuilder.UseSqlServer(connectionString);

            return new InnoviaHubDB(optionsBuilder.Options);
        }
    }
}
