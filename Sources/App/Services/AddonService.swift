import Vapor
import Foundation

struct AddonService {
    func fetchManifest(from url: String, on req: Request) async throws -> Addon {
        guard let manifestURL = URL(string: url) else {
            throw Abort(.badRequest, reason: "Invalid manifest URL")
        }
        
        let response = try await req.client.get(URI(string: url))
        
        guard response.status == .ok else {
            throw Abort(.badGateway, reason: "Failed to fetch manifest from \(url)")
        }
        
        guard let body = response.body else {
            throw Abort(.badGateway, reason: "Empty response from manifest URL")
        }
        
        let manifestData = try JSONDecoder().decode(AddonManifest.self, from: body)
        
        return Addon(
            manifestUrl: url,
            name: manifestData.name,
            description: manifestData.description,
            version: manifestData.version,
            logo: manifestData.logo,
            background: manifestData.background,
            types: manifestData.types,
            resources: manifestData.resources,
            idPrefixes: manifestData.idPrefixes,
            catalogs: manifestData.catalogs.map { catalog in
                AddonCatalog(
                    type: catalog.type,
                    id: catalog.id,
                    name: catalog.name,
                    extra: catalog.extra?.map { extra in
                        AddonCatalogExtra(
                            name: extra.name,
                            options: extra.options,
                            isRequired: extra.isRequired,
                            optionsLimit: extra.optionsLimit
                        )
                    }
                )
            },
            behaviorHints: manifestData.behaviorHints.map { hints in
                AddonBehaviorHints(
                    adult: hints.adult,
                    p2p: hints.p2p,
                    configurable: hints.configurable,
                    configurationRequired: hints.configurationRequired
                )
            }
        )
    }
    
    func getCatalog(addon: Addon, type: String, id: String, req: Request) async throws -> Response {
        let baseURL = addon.manifestUrl.replacingOccurrences(of: "/manifest.json", with: "")
        let catalogURL = "\(baseURL)/catalog/\(type)/\(id).json"
        
        // Add query parameters if present
        var urlComponents = URLComponents(string: catalogURL)!
        if !req.url.query.isEmpty {
            urlComponents.query = req.url.query
        }
        
        guard let finalURL = urlComponents.url else {
            throw Abort(.badRequest, reason: "Invalid catalog URL")
        }
        
        let response = try await req.client.get(URI(string: finalURL.absoluteString))
        
        guard response.status == .ok else {
            throw Abort(.badGateway, reason: "Failed to fetch catalog from addon")
        }
        
        // Return the response as-is, preserving the original structure
        let httpResponse = Response(status: response.status)
        httpResponse.body = response.body
        httpResponse.headers = response.headers
        
        return httpResponse
    }
    
    func getStream(addon: Addon, type: String, id: String, req: Request) async throws -> Response {
        let baseURL = addon.manifestUrl.replacingOccurrences(of: "/manifest.json", with: "")
        let streamURL = "\(baseURL)/stream/\(type)/\(id).json"
        
        let response = try await req.client.get(URI(string: streamURL))
        
        guard response.status == .ok else {
            throw Abort(.badGateway, reason: "Failed to fetch streams from addon")
        }
        
        // Return the response as-is, preserving the original structure
        let httpResponse = Response(status: response.status)
        httpResponse.body = response.body
        httpResponse.headers = response.headers
        
        return httpResponse
    }
}

// Helper structures for decoding manifest
struct AddonManifest: Codable {
    let name: String
    let description: String?
    let version: String
    let logo: String?
    let background: String?
    let types: [String]
    let resources: [String]
    let idPrefixes: [String]?
    let catalogs: [ManifestCatalog]
    let behaviorHints: ManifestBehaviorHints?
}

struct ManifestCatalog: Codable {
    let type: String
    let id: String
    let name: String?
    let extra: [ManifestCatalogExtra]?
}

struct ManifestCatalogExtra: Codable {
    let name: String
    let options: [String]?
    let isRequired: Bool?
    let optionsLimit: Int?
}

struct ManifestBehaviorHints: Codable {
    let adult: Bool?
    let p2p: Bool?
    let configurable: Bool?
    let configurationRequired: Bool?
}