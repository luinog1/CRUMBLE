import Fluent

struct CreateAddon: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("addons")
            .id()
            .field("manifest_url", .string, .required)
            .field("name", .string, .required)
            .field("description", .string)
            .field("version", .string, .required)
            .field("logo", .string)
            .field("background", .string)
            .field("types", .array(of: .string), .required)
            .field("resources", .array(of: .string), .required)
            .field("id_prefixes", .array(of: .string))
            .field("catalogs", .json, .required)
            .field("behavior_hints", .json)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "manifest_url")
            .create()
    }
    
    func revert(on database: Database) async throws {
        try await database.schema("addons").delete()
    }
}