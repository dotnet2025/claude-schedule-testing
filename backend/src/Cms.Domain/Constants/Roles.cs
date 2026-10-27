namespace Cms.Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public static readonly string[] All = [Admin, Editor];
}

public static class Policies
{
    public const string AdminOnly = "AdminOnly";
    public const string EditorOrAdmin = "EditorOrAdmin";
}
