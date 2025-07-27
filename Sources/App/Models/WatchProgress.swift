import Fluent
import Vapor

final class WatchProgress: Model, Content {
    static let schema = "watch_progress"
    
    @ID(key: .id)
    var id: UUID?
    
    @Parent(key: "user_id")
    var user: User
    
    @Field(key: "content_id")
    var contentId: String
    
    @Field(key: "content_type")
    var contentType: String // "movie" or "series"
    
    @Field(key: "season")
    var season: Int?
    
    @Field(key: "episode")
    var episode: Int?
    
    @Field(key: "current_time")
    var currentTime: Double // in seconds
    
    @Field(key: "duration")
    var duration: Double // in seconds
    
    @Field(key: "progress_percentage")
    var progressPercentage: Double // 0.0 to 1.0
    
    @Field(key: "is_completed")
    var isCompleted: Bool
    
    @Field(key: "last_watched")
    var lastWatched: Date
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() { }
    
    init(id: UUID? = nil,
         userID: UUID,
         contentId: String,
         contentType: String,
         season: Int? = nil,
         episode: Int? = nil,
         currentTime: Double,
         duration: Double,
         progressPercentage: Double,
         isCompleted: Bool = false,
         lastWatched: Date = Date()) {
        self.id = id
        self.$user.id = userID
        self.contentId = contentId
        self.contentType = contentType
        self.season = season
        self.episode = episode
        self.currentTime = currentTime
        self.duration = duration
        self.progressPercentage = progressPercentage
        self.isCompleted = isCompleted
        self.lastWatched = lastWatched
    }
}

struct UpdateProgressRequest: Content {
    let contentId: String
    let contentType: String
    let season: Int?
    let episode: Int?
    let currentTime: Double
    let duration: Double
    let isCompleted: Bool?
}

struct ProgressResponse: Content {
    let id: UUID
    let contentId: String
    let contentType: String
    let season: Int?
    let episode: Int?
    let currentTime: Double
    let duration: Double
    let progressPercentage: Double
    let isCompleted: Bool
    let lastWatched: Date
    
    init(progress: WatchProgress) {
        self.id = progress.id!
        self.contentId = progress.contentId
        self.contentType = progress.contentType
        self.season = progress.season
        self.episode = progress.episode
        self.currentTime = progress.currentTime
        self.duration = progress.duration
        self.progressPercentage = progress.progressPercentage
        self.isCompleted = progress.isCompleted
        self.lastWatched = progress.lastWatched
    }
}