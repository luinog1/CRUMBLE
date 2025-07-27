import Fluent
import Vapor

struct LibraryController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let library = routes.grouped("library")
        library.get(":userID", use: getUserLibrary)
        library.post(":userID", use: addToLibrary)
        library.put(":userID", ":itemID", use: updateLibraryItem)
        library.delete(":userID", ":itemID", use: removeFromLibrary)
        library.get(":userID", "favorites", use: getFavorites)
        library.get(":userID", "watching", use: getWatching)
        library.get(":userID", "completed", use: getCompleted)
    }

    func getUserLibrary(req: Request) async throws -> [LibraryItem] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        return try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .sort(\.$addedDate, .descending)
            .all()
    }

    func addToLibrary(req: Request) async throws -> LibraryItem {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        let createRequest = try req.content.decode(CreateLibraryItemRequest.self)
        
        // Check if item already exists in user's library
        let existingItem = try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$contentId == createRequest.contentId)
            .first()
        
        if existingItem != nil {
            throw Abort(.conflict, reason: "Item already exists in library")
        }
        
        let libraryItem = LibraryItem(
            userID: userID,
            contentId: createRequest.contentId,
            contentType: createRequest.contentType,
            title: createRequest.title,
            poster: createRequest.poster,
            year: createRequest.year,
            imdbRating: createRequest.imdbRating,
            genres: createRequest.genres,
            description: createRequest.description,
            isFavorite: createRequest.isFavorite ?? false,
            watchStatus: createRequest.watchStatus ?? "plan_to_watch"
        )
        
        try await libraryItem.save(on: req.db)
        return libraryItem
    }

    func updateLibraryItem(req: Request) async throws -> LibraryItem {
        guard let userID = req.parameters.get("userID", as: UUID.self),
              let itemID = req.parameters.get("itemID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        guard let libraryItem = try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$id == itemID)
            .first() else {
            throw Abort(.notFound)
        }
        
        let updateRequest = try req.content.decode(UpdateLibraryItemRequest.self)
        
        if let isFavorite = updateRequest.isFavorite {
            libraryItem.isFavorite = isFavorite
        }
        
        if let watchStatus = updateRequest.watchStatus {
            libraryItem.watchStatus = watchStatus
        }
        
        try await libraryItem.save(on: req.db)
        return libraryItem
    }

    func removeFromLibrary(req: Request) async throws -> HTTPStatus {
        guard let userID = req.parameters.get("userID", as: UUID.self),
              let itemID = req.parameters.get("itemID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        guard let libraryItem = try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$id == itemID)
            .first() else {
            throw Abort(.notFound)
        }
        
        try await libraryItem.delete(on: req.db)
        return .noContent
    }
    
    func getFavorites(req: Request) async throws -> [LibraryItem] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        return try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$isFavorite == true)
            .sort(\.$addedDate, .descending)
            .all()
    }
    
    func getWatching(req: Request) async throws -> [LibraryItem] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        return try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$watchStatus == "watching")
            .sort(\.$addedDate, .descending)
            .all()
    }
    
    func getCompleted(req: Request) async throws -> [LibraryItem] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        return try await LibraryItem.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$watchStatus == "completed")
            .sort(\.$addedDate, .descending)
            .all()
    }
}