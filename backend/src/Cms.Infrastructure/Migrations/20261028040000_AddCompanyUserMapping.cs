using System;
using Cms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Infrastructure.Migrations
{
    /// <summary>
    /// HAND-AUTHORED (no dotnet SDK was available - see docs/known-issues.md KI-021). The model snapshot was edited by hand too.
    /// Regenerate with `dotnet ef migrations remove` + `add` if this differs from the real tooling output.
    /// </summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261028040000_AddCompanyUserMapping")]
    public partial class AddCompanyUserMapping : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ---- Users: profile columns needed by the Company-User module (existing rows are migrated below) ----
            migrationBuilder.AddColumn<string>(name: "FirstName", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "LastName", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "Username", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "Phone", table: "Users", type: "TEXT", maxLength: 25, nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "UpdatedAt", table: "Users", type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Existing data: first name = old display name, username = e-mail (already unique and lower-case), UpdatedAt = CreatedAt.
            migrationBuilder.Sql("UPDATE \"Users\" SET \"FirstName\" = substr(\"DisplayName\", 1, 100), \"Username\" = lower(substr(\"Email\", 1, 100)), \"UpdatedAt\" = \"CreatedAt\";");

            migrationBuilder.CreateIndex(name: "IX_Users_Username", table: "Users", column: "Username", unique: true);

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "INTEGER", nullable: false).Annotation("Sqlite:Autoincrement", true),
                    CompanyCode = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    CompanyName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: true),
                    UpdatedById = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.CompanyId);
                    table.ForeignKey(name: "FK_Companies_Users_CreatedById", column: x => x.CreatedById, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(name: "FK_Companies_Users_UpdatedById", column: x => x.UpdatedById, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CompanyUsers",
                columns: table => new
                {
                    CompanyUserId = table.Column<int>(type: "INTEGER", nullable: false).Annotation("Sqlite:Autoincrement", true),
                    CompanyId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPrimaryCompany = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: true),
                    UpdatedById = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyUsers", x => x.CompanyUserId);
                    table.ForeignKey(name: "FK_CompanyUsers_Companies_CompanyId", column: x => x.CompanyId, principalTable: "Companies", principalColumn: "CompanyId", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(name: "FK_CompanyUsers_Users_UserId", column: x => x.UserId, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(name: "FK_CompanyUsers_Users_CreatedById", column: x => x.CreatedById, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(name: "FK_CompanyUsers_Users_UpdatedById", column: x => x.UpdatedById, principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(name: "IX_Companies_CompanyCode", table: "Companies", column: "CompanyCode", unique: true);
            migrationBuilder.CreateIndex(name: "IX_Companies_CreatedById", table: "Companies", column: "CreatedById");
            migrationBuilder.CreateIndex(name: "IX_Companies_UpdatedById", table: "Companies", column: "UpdatedById");
            migrationBuilder.CreateIndex(name: "IX_CompanyUsers_CompanyId_UserId", table: "CompanyUsers", columns: new[] { "CompanyId", "UserId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_CompanyUsers_CreatedById", table: "CompanyUsers", column: "CreatedById");
            migrationBuilder.CreateIndex(name: "IX_CompanyUsers_UpdatedById", table: "CompanyUsers", column: "UpdatedById");
            migrationBuilder.CreateIndex(name: "IX_CompanyUsers_UserId", table: "CompanyUsers", column: "UserId");
            // At most one ACTIVE PRIMARY mapping per user (partial unique index).
            migrationBuilder.CreateIndex(name: "UX_CompanyUsers_OnePrimaryPerUser", table: "CompanyUsers", column: "UserId", unique: true,
                filter: "\"IsPrimaryCompany\" = 1 AND \"IsActive\" = 1");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CompanyUsers");
            migrationBuilder.DropTable(name: "Companies");
            migrationBuilder.DropIndex(name: "IX_Users_Username", table: "Users");
            migrationBuilder.DropColumn(name: "FirstName", table: "Users");
            migrationBuilder.DropColumn(name: "LastName", table: "Users");
            migrationBuilder.DropColumn(name: "Username", table: "Users");
            migrationBuilder.DropColumn(name: "Phone", table: "Users");
            migrationBuilder.DropColumn(name: "UpdatedAt", table: "Users");
        }
    }
}
