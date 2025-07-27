import Fluent
import Vapor

struct AddonController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let addons = routes.grouped("addons")
        addons.get(use: index)
        addons.post(use: create)
        addons.group(":addonID") { addon in
            addon.delete(use: delete)
            addon.get(use: show)
            addon.put(use: update)
        }
        addons.post("fetch-manifest", use: fetchManifest)
        addons.get(":addonID", "catalog", ":type", ":id", use: getCatalog)
        addons.get(":addonID", "stream", ":type", ":id", use: getStream)
    }

    func index(req: Request) async throws -> [Addon] {
        try await Addon.query(on: req.db).all()
    }

    func create(req: Request) async throws -> Addon {
        let addon = try req.content.decode(Addon.self)
        try await addon.save(on: req.db)
        return addon
    }

    func show(req: Request) async throws -> Addon {
        guard let addon = try await Addon.find(req.parameters.get("addonID"), on: req.db) else {
            throw Abort(.notFound)
        }
        return addon
    }

    func update(req: Request) async throws -> Addon {
        guard let addon = try await Addon.find(req.parameters.get("addonID"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        let updateData = try req.content.decode(Addon.self)
        addon.name = updateData.name
        addon.description = updateData.description
        addon.version = updateData.version
        addon.logo = updateData.logo
        addon.background = updateData.background
        addon.types = updateData.types
        addon.resources = updateData.resources
        addon.idPrefixes = updateData.idPrefixes
        addon.catalogs = updateData.catalogs
        addon.behaviorHints = updateData.behaviorHints
        
        try await addon.save(on: req.db)
        return addon
    }

    func delete(req: Request) async throws -> HTTPStatus {
        guard let addon = try await Addon.find(req.parameters.get("addonID"), on: req.db) else {
            throw Abort(.notFound)
        }
        try await addon.delete(on: req.db)
        return .noContent
    }
    
    func fetchManifest(req: Request) async throws -> Addon {
        struct FetchManifestRequest: Content {
            let manifestUrl: String
        }
        
        let request = try req.content.decode(FetchManifestRequest.self)
        let addonService = AddonService()
        
        let manifest = try await addonService.fetchManifest(from: request.manifestUrl, on: req)
        
        // Check if addon already exists
        if let existingAddon = try await Addon.query(on: req.db)
            .filter(\.$manifestUrl == request.manifestUrl)
            .first() {
            // Update existing addon
            existingAddon.name = manifest.name
            existingAddon.description = manifest.description
            existingAddon.version = manifest.version
            existingAddon.logo = manifest.logo
            existingAddon.background = manifest.background
            existingAddon.types = manifest.types
            existingAddon.resources = manifest.resources
            existingAddon.idPrefixes = manifest.idPrefixes
            existingAddon.catalogs = manifest.catalogs
            existingAddon.behaviorHints = manifest.behaviorHints
            
            try await existingAddon.save(on: req.db)
            return existingAddon
        } else {
            // Create new addon
            let addon = Addon(
                manifestUrl: request.manifestUrl,
                name: manifest.name,
                description: manifest.description,
                version: manifest.version,
                logo: manifest.logo,
                background: manifest.background,
                types: manifest.types,
                resources: manifest.resources,
                idPrefixes: manifest.idPrefixes,
                catalogs: manifest.catalogs,
                behaviorHints: manifest.behaviorHints
            )
            
            try await addon.save(on: req.db)
            return addon
        }
    }
    
    func getCatalog(req: Request) async throws -> Response {
        guard let addonID = req.parameters.get("addonID", as: UUID.self),
              let type = req.parameters.get("type"),
              let id = req.parameters.get("id") else {
            throw Abort(.badRequest)
        }
        
        guard let addon = try await Addon.find(addonID, on: req.db) else {
            throw Abort(.notFound)
        }
        
        let addonService = AddonService()
        return try await addonService.getCatalog(addon: addon, type: type, id: id, req: req)
    }
    
    func getStream(req: Request) async throws -> Response {
        guard let addonID = req.parameters.get("addonID", as: UUID.self),
              let type = req.parameters.get("type"),
              let id = req.parameters.get("id") else {
            throw Abort(.badRequest)
        }
        
        guard let addon = try await Addon.find(addonID, on: req.db) else {
            throw Abort(.notFound)
        }
        
        let addonService = AddonService()
        return try await addonService.getStream(addon: addon, type: type, id: id, req: req)
    }
}