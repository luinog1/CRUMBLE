import Fluent

struct CreateLibraryItem: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("library_items")
            .id()
            .field("user_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("content_id", .string, .required)
            .field("content_type", .string, .required)
            .field("title", .string, .required)
            .field("poster", .string)
            .field("year", .int)
            .field("imdb_rating", .double)
            .field("genres", .array(of: .string))
            .field("description", .string)
            .field("is_favorite", .bool, .required, .custom("DEFAULT FALSE"))
            .field("watch_status", .string, .required, .custom("DEFAULT 'plan_to_watch'"))
            .field("added_date", .datetime, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "user_id", "content_id")
            .create()
    }
    
    func revert(on database: Database) async throws {
        try await database.schema("library_items").delete()
    }
}