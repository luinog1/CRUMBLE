import Fluent
import Vapor

struct UserController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let users = routes.grouped("users")
        users.post(use: create)
        users.get(use: index)
        users.group(":userID") { user in
            user.get(use: show)
            user.put(use: update)
            user.delete(use: delete)
            user.put("preferences", use: updatePreferences)
        }
    }

    func index(req: Request) async throws -> [UserResponse] {
        let users = try await User.query(on: req.db).all()
        return users.map { UserResponse(user: $0) }
    }

    func create(req: Request) async throws -> UserResponse {
        let createRequest = try req.content.decode(CreateUserRequest.self)
        
        // Check if username or email already exists
        let existingUser = try await User.query(on: req.db)
            .group(.or) { group in
                group.filter(\.$username == createRequest.username)
                group.filter(\.$email == createRequest.email)
            }
            .first()
        
        if existingUser != nil {
            throw Abort(.conflict, reason: "Username or email already exists")
        }
        
        // Hash password (in production, use proper password hashing)
        let passwordHash = try await req.password.async.hash(createRequest.password)
        
        let user = User(
            username: createRequest.username,
            email: createRequest.email,
            passwordHash: passwordHash
        )
        
        try await user.save(on: req.db)
        return UserResponse(user: user)
    }

    func show(req: Request) async throws -> UserResponse {
        guard let user = try await User.find(req.parameters.get("userID"), on: req.db) else {
            throw Abort(.notFound)
        }
        return UserResponse(user: user)
    }

    func update(req: Request) async throws -> UserResponse {
        guard let user = try await User.find(req.parameters.get("userID"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        let updateData = try req.content.decode(CreateUserRequest.self)
        
        // Check if new username or email conflicts with existing users (excluding current user)
        let conflictingUser = try await User.query(on: req.db)
            .filter(\.$id != user.id!)
            .group(.or) { group in
                group.filter(\.$username == updateData.username)
                group.filter(\.$email == updateData.email)
            }
            .first()
        
        if conflictingUser != nil {
            throw Abort(.conflict, reason: "Username or email already exists")
        }
        
        user.username = updateData.username
        user.email = updateData.email
        
        if !updateData.password.isEmpty {
            user.passwordHash = try await req.password.async.hash(updateData.password)
        }
        
        try await user.save(on: req.db)
        return UserResponse(user: user)
    }

    func delete(req: Request) async throws -> HTTPStatus {
        guard let user = try await User.find(req.parameters.get("userID"), on: req.db) else {
            throw Abort(.notFound)
        }
        try await user.delete(on: req.db)
        return .noContent
    }
    
    func updatePreferences(req: Request) async throws -> UserResponse {
        guard let user = try await User.find(req.parameters.get("userID"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        let preferences = try req.content.decode(UserPreferences.self)
        user.preferences = preferences
        
        try await user.save(on: req.db)
        return UserResponse(user: user)
    }
}