import Fluent

struct CreateWatchProgress: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("watch_progress")
            .id()
            .field("user_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("content_id", .string, .required)
            .field("content_type", .string, .required)
            .field("season", .int)
            .field("episode", .int)
            .field("current_time", .double, .required, .custom("DEFAULT 0"))
            .field("duration", .double, .required, .custom("DEFAULT 0"))
            .field("progress_percentage", .double, .required, .custom("DEFAULT 0"))
            .field("is_completed", .bool, .required, .custom("DEFAULT FALSE"))
            .field("last_watched", .datetime, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "user_id", "content_id", "season", "episode")
            .create()
    }
    
    func revert(on database: Database) async throws {
        try await database.schema("watch_progress").delete()
    }
}