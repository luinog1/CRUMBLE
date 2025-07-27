import Fluent
import Vapor

final class LibraryItem: Model, Content {
    static let schema = "library_items"
    
    @ID(key: .id)
    var id: UUID?
    
    @Parent(key: "user_id")
    var user: User
    
    @Field(key: "content_id")
    var contentId: String
    
    @Field(key: "content_type")
    var contentType: String // "movie" or "series"
    
    @Field(key: "title")
    var title: String
    
    @Field(key: "poster")
    var poster: String?
    
    @Field(key: "year")
    var year: Int?
    
    @Field(key: "imdb_rating")
    var imdbRating: Double?
    
    @Field(key: "genres")
    var genres: [String]?
    
    @Field(key: "description")
    var description: String?
    
    @Field(key: "is_favorite")
    var isFavorite: Bool
    
    @Field(key: "watch_status")
    var watchStatus: String // "watching", "completed", "plan_to_watch", "dropped"
    
    @Field(key: "added_date")
    var addedDate: Date
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() { }
    
    init(id: UUID? = nil,
         userID: UUID,
         contentId: String,
         contentType: String,
         title: String,
         poster: String? = nil,
         year: Int? = nil,
         imdbRating: Double? = nil,
         genres: [String]? = nil,
         description: String? = nil,
         isFavorite: Bool = false,
         watchStatus: String = "plan_to_watch",
         addedDate: Date = Date()) {
        self.id = id
        self.$user.id = userID
        self.contentId = contentId
        self.contentType = contentType
        self.title = title
        self.poster = poster
        self.year = year
        self.imdbRating = imdbRating
        self.genres = genres
        self.description = description
        self.isFavorite = isFavorite
        self.watchStatus = watchStatus
        self.addedDate = addedDate
    }
}

struct CreateLibraryItemRequest: Content {
    let contentId: String
    let contentType: String
    let title: String
    let poster: String?
    let year: Int?
    let imdbRating: Double?
    let genres: [String]?
    let description: String?
    let isFavorite: Bool?
    let watchStatus: String?
}

struct UpdateLibraryItemRequest: Content {
    let isFavorite: Bool?
    let watchStatus: String?
}