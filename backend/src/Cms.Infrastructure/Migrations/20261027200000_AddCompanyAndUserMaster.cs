using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Infrastructure.Migrations
{
    /// <summary>
    /// Company Master + User Master. HAND-AUTHORED (no .NET SDK was available when written; see docs/known-issues.md KI-013).
    /// SQLite cannot add a foreign key to an existing table, so the three new Users FK columns are added with
    /// "ALTER TABLE ... ADD COLUMN ... REFERENCES" (allowed because the default is NULL). Existing rows are back-filled:
    /// DisplayName is split into FirstName/LastName, Username defaults to the e-mail local part (later duplicates get "-{Id}").
    /// </summary>
    /// <inheritdoc />
    public partial class AddCompanyAndUserMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CompanyCode = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    CompanyName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 25, nullable: true),
                    Website = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    AddressLine1 = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true),
                    AddressLine2 = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    LogoMediaId = table.Column<int>(type: "INTEGER", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedById = table.Column<int>(type: "INTEGER", nullable: true),
                    UpdatedById = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.CompanyId);
                    table.ForeignKey(
                        name: "FK_Companies_MediaFiles_LogoMediaId",
                        column: x => x.LogoMediaId,
                        principalTable: "MediaFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Companies_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Companies_Users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.AddColumn<string>(name: "FirstName", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "LastName", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "Username", table: "Users", type: "TEXT", maxLength: 100, nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "Phone", table: "Users", type: "TEXT", maxLength: 25, nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "UpdatedAt", table: "Users", type: "TEXT", nullable: false, defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
            migrationBuilder.AddColumn<DateTime>(name: "LastLoginAt", table: "Users", type: "TEXT", nullable: true);

            // FK columns (nullable, default NULL) - SQLite accepts REFERENCES in ADD COLUMN under these conditions.
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN \"CompanyId\" INTEGER NULL REFERENCES \"Companies\" (\"CompanyId\") ON DELETE SET NULL;");
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN \"CreatedById\" INTEGER NULL REFERENCES \"Users\" (\"Id\") ON DELETE SET NULL;");
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN \"UpdatedById\" INTEGER NULL REFERENCES \"Users\" (\"Id\") ON DELETE SET NULL;");

            // Back-fill existing users.
            migrationBuilder.Sql(@"UPDATE ""Users"" SET
  ""FirstName"" = CASE WHEN instr(trim(""DisplayName""), ' ') > 0 THEN substr(trim(""DisplayName""), 1, instr(trim(""DisplayName""), ' ') - 1) ELSE trim(""DisplayName"") END,
  ""LastName""  = CASE WHEN instr(trim(""DisplayName""), ' ') > 0 THEN trim(substr(trim(""DisplayName""), instr(trim(""DisplayName""), ' ') + 1)) ELSE 'User' END;");
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""FirstName"" = 'User' WHERE ""FirstName"" = '';");
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""LastName"" = 'User' WHERE ""LastName"" = '';");
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""Username"" = substr(lower(CASE WHEN instr(""Email"", '@') > 1 THEN substr(""Email"", 1, instr(""Email"", '@') - 1) ELSE ""Email"" END), 1, 90);");
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""Username"" = ""Username"" || '-' || ""Id"" WHERE ""Id"" IN (
  SELECT u.""Id"" FROM ""Users"" u WHERE EXISTS (SELECT 1 FROM ""Users"" o WHERE o.""Username"" = u.""Username"" AND o.""Id"" < u.""Id""));");
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""UpdatedAt"" = ""CreatedAt"";");

            migrationBuilder.CreateIndex(name: "IX_Users_CompanyId", table: "Users", column: "CompanyId");
            migrationBuilder.CreateIndex(name: "IX_Users_CreatedById", table: "Users", column: "CreatedById");
            migrationBuilder.CreateIndex(name: "IX_Users_UpdatedById", table: "Users", column: "UpdatedById");
            migrationBuilder.CreateIndex(name: "IX_Users_Username", table: "Users", column: "Username", unique: true);

            migrationBuilder.CreateIndex(name: "IX_Companies_CompanyCode", table: "Companies", column: "CompanyCode", unique: true);
            migrationBuilder.CreateIndex(name: "IX_Companies_CreatedById", table: "Companies", column: "CreatedById");
            migrationBuilder.CreateIndex(name: "IX_Companies_LogoMediaId", table: "Companies", column: "LogoMediaId");
            migrationBuilder.CreateIndex(name: "IX_Companies_UpdatedById", table: "Companies", column: "UpdatedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Users_CompanyId", table: "Users");
            migrationBuilder.DropIndex(name: "IX_Users_CreatedById", table: "Users");
            migrationBuilder.DropIndex(name: "IX_Users_UpdatedById", table: "Users");
            migrationBuilder.DropIndex(name: "IX_Users_Username", table: "Users");
            migrationBuilder.DropTable(name: "Companies");
            foreach (var c in new[] { "CompanyId", "CreatedById", "UpdatedById", "FirstName", "LastName", "Username", "Phone", "UpdatedAt", "LastLoginAt" })
                migrationBuilder.DropColumn(name: c, table: "Users");
        }
    }
}
