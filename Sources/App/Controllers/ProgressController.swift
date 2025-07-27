import Fluent
import Vapor

struct ProgressController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let progress = routes.grouped("progress")
        progress.get(":userID", use: getUserProgress)
        progress.post(":userID", use: updateProgress)
        progress.get(":userID", ":contentID", use: getContentProgress)
        progress.delete(":userID", ":progressID", use: deleteProgress)
        progress.get(":userID", "recent", use: getRecentProgress)
    }

    func getUserProgress(req: Request) async throws -> [ProgressResponse] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        let progressItems = try await WatchProgress.query(on: req.db)
            .filter(\.$user.$id == userID)
            .sort(\.$lastWatched, .descending)
            .all()
        
        return progressItems.map { ProgressResponse(progress: $0) }
    }

    func updateProgress(req: Request) async throws -> ProgressResponse {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        let updateRequest = try req.content.decode(UpdateProgressRequest.self)
        
        // Calculate progress percentage
        let progressPercentage = updateRequest.duration > 0 ? updateRequest.currentTime / updateRequest.duration : 0.0
        let isCompleted = updateRequest.isCompleted ?? (progressPercentage >= 0.9) // Consider 90% as completed
        
        // Find existing progress or create new one
        let existingProgress = try await WatchProgress.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$contentId == updateRequest.contentId)
            .filter(\.$season == updateRequest.season)
            .filter(\.$episode == updateRequest.episode)
            .first()
        
        let watchProgress: WatchProgress
        
        if let existing = existingProgress {
            // Update existing progress
            existing.currentTime = updateRequest.currentTime
            existing.duration = updateRequest.duration
            existing.progressPercentage = progressPercentage
            existing.isCompleted = isCompleted
            existing.lastWatched = Date()
            
            try await existing.save(on: req.db)
            watchProgress = existing
        } else {
            // Create new progress
            watchProgress = WatchProgress(
                userID: userID,
                contentId: updateRequest.contentId,
                contentType: updateRequest.contentType,
                season: updateRequest.season,
                episode: updateRequest.episode,
                currentTime: updateRequest.currentTime,
                duration: updateRequest.duration,
                progressPercentage: progressPercentage,
                isCompleted: isCompleted
            )
            
            try await watchProgress.save(on: req.db)
        }
        
        return ProgressResponse(progress: watchProgress)
    }

    func getContentProgress(req: Request) async throws -> [ProgressResponse] {
        guard let userID = req.parameters.get("userID", as: UUID.self),
              let contentID = req.parameters.get("contentID") else {
            throw Abort(.badRequest)
        }
        
        let progressItems = try await WatchProgress.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$contentId == contentID)
            .sort(\.$season)
            .sort(\.$episode)
            .all()
        
        return progressItems.map { ProgressResponse(progress: $0) }
    }

    func deleteProgress(req: Request) async throws -> HTTPStatus {
        guard let userID = req.parameters.get("userID", as: UUID.self),
              let progressID = req.parameters.get("progressID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        guard let progress = try await WatchProgress.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$id == progressID)
            .first() else {
            throw Abort(.notFound)
        }
        
        try await progress.delete(on: req.db)
        return .noContent
    }
    
    func getRecentProgress(req: Request) async throws -> [ProgressResponse] {
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        
        let limit = req.query["limit", Int.self] ?? 10
        
        let progressItems = try await WatchProgress.query(on: req.db)
            .filter(\.$user.$id == userID)
            .filter(\.$isCompleted == false)
            .sort(\.$lastWatched, .descending)
            .limit(limit)
            .all()
        
        return progressItems.map { ProgressResponse(progress: $0) }
    }
}