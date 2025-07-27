import Fluent
import Vapor

final class User: Model, Content {
    static let schema = "users"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "username")
    var username: String
    
    @Field(key: "email")
    var email: String
    
    @Field(key: "password_hash")
    var passwordHash: String
    
    @Field(key: "preferences")
    var preferences: UserPreferences?
    
    @Children(for: \.$user)
    var libraryItems: [LibraryItem]
    
    @Children(for: \.$user)
    var watchProgress: [WatchProgress]
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() { }
    
    init(id: UUID? = nil,
         username: String,
         email: String,
         passwordHash: String,
         preferences: UserPreferences? = nil) {
        self.id = id
        self.username = username
        self.email = email
        self.passwordHash = passwordHash
        self.preferences = preferences
    }
}

struct UserPreferences: Codable {
    let theme: String?
    let language: String?
    let autoplay: Bool?
    let quality: String?
    let subtitles: Bool?
    let volume: Double?
}

struct CreateUserRequest: Content {
    let username: String
    let email: String
    let password: String
}

struct UserResponse: Content {
    let id: UUID
    let username: String
    let email: String
    let preferences: UserPreferences?
    let createdAt: Date?
    
    init(user: User) {
        self.id = user.id!
        self.username = user.username
        self.email = user.email
        self.preferences = user.preferences
        self.createdAt = user.createdAt
    }
}