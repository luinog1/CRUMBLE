import Fluent
import Vapor

final class Addon: Model, Content {
    static let schema = "addons"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "manifest_url")
    var manifestUrl: String
    
    @Field(key: "name")
    var name: String
    
    @Field(key: "description")
    var description: String?
    
    @Field(key: "version")
    var version: String
    
    @Field(key: "logo")
    var logo: String?
    
    @Field(key: "background")
    var background: String?
    
    @Field(key: "types")
    var types: [String]
    
    @Field(key: "resources")
    var resources: [String]
    
    @Field(key: "id_prefixes")
    var idPrefixes: [String]?
    
    @Field(key: "catalogs")
    var catalogs: [AddonCatalog]
    
    @Field(key: "behavior_hints")
    var behaviorHints: AddonBehaviorHints?
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() { }
    
    init(id: UUID? = nil,
         manifestUrl: String,
         name: String,
         description: String? = nil,
         version: String,
         logo: String? = nil,
         background: String? = nil,
         types: [String],
         resources: [String],
         idPrefixes: [String]? = nil,
         catalogs: [AddonCatalog],
         behaviorHints: AddonBehaviorHints? = nil) {
        self.id = id
        self.manifestUrl = manifestUrl
        self.name = name
        self.description = description
        self.version = version
        self.logo = logo
        self.background = background
        self.types = types
        self.resources = resources
        self.idPrefixes = idPrefixes
        self.catalogs = catalogs
        self.behaviorHints = behaviorHints
    }
}

struct AddonCatalog: Codable {
    let type: String
    let id: String
    let name: String?
    let extra: [AddonCatalogExtra]?
}

struct AddonCatalogExtra: Codable {
    let name: String
    let options: [String]?
    let isRequired: Bool?
    let optionsLimit: Int?
}

struct AddonBehaviorHints: Codable {
    let adult: Bool?
    let p2p: Bool?
    let configurable: Bool?
    let configurationRequired: Bool?
}