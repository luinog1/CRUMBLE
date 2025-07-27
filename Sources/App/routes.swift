import Fluent
import Vapor

func routes(_ app: Application) throws {
    app.get { req async in
        "CRUMBLE Backend API is running!"
    }

    app.get("hello") { req async -> String in
        "Hello, world!"
    }
    
    // API v1 routes
    let api = app.grouped("api", "v1")
    
    // Addon routes
    try api.register(collection: AddonController())
    
    // User routes
    try api.register(collection: UserController())
    
    // Library routes
    try api.register(collection: LibraryController())
    
    // Progress routes
    try api.register(collection: ProgressController())
}