// [DI Edge-Case] Location-Based Key Sanitizer Test
import { describe, it, expect, beforeEach } from "bun:test";
import { KeySanitizer } from "../interface-resolver/key-sanitizer";

describe("[DI Edge-Case] Location-Based Key Generation", () => {
  let keySanitizer: KeySanitizer;

  beforeEach(() => {
    keySanitizer = new KeySanitizer();
  });

  describe("createLocationBasedKey", () => {
    it("should generate location-based key with file path and line number", () => {
      const result = keySanitizer.createLocationBasedKey(
        "TodoServiceInterface",
        "/home/project/src/todo/interfaces/TodoInterfaces.ts",
        26
      );

      expect(result).toBe("TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_26");
    });

    it("should handle complex file paths correctly", () => {
      const result = keySanitizer.createLocationBasedKey(
        "UserService",
        "/Users/frank/Projects/tdi2/monorepo/apps/legacy/src/services/user/UserService.ts",
        15
      );

      expect(result).toBe("UserService__src_services_user_UserService_ts_line_15");
    });

    it("should handle generic interface names", () => {
      const result = keySanitizer.createLocationBasedKey(
        "CacheInterface<string>",
        "/project/src/interfaces/CacheInterface.ts",
        10
      );

      expect(result).toBe("CacheInterface_string__src_interfaces_CacheInterface_ts_line_10");
    });

    it("should fallback to standard sanitization when location info is missing", () => {
      const resultNoPath = keySanitizer.createLocationBasedKey("TodoServiceInterface");
      const resultNoLine = keySanitizer.createLocationBasedKey("TodoServiceInterface", "/src/test.ts");

      expect(resultNoPath).toBe("TodoServiceInterface");
      expect(resultNoLine).toBe("TodoServiceInterface");
    });
  });

  describe("isLocationBasedKey", () => {
    it("should identify location-based keys", () => {
      const locationKey = "TodoServiceInterface__src_todo_types_ts_line_26";
      const standardKey = "TodoServiceInterface";

      expect(keySanitizer.isLocationBasedKey(locationKey)).toBe(true);
      expect(keySanitizer.isLocationBasedKey(standardKey)).toBe(false);
    });
  });

  describe("extractInterfaceNameFromLocationKey", () => {
    it("should extract interface name from location-based key", () => {
      const locationKey = "TodoServiceInterface__src_todo_types_ts_line_26";
      const result = keySanitizer.extractInterfaceNameFromLocationKey(locationKey);
      
      expect(result).toBe("TodoServiceInterface");
    });

    it("should return key unchanged if not location-based", () => {
      const standardKey = "TodoServiceInterface";
      const result = keySanitizer.extractInterfaceNameFromLocationKey(standardKey);
      
      expect(result).toBe("TodoServiceInterface");
    });

    it("should handle generic interface names in location keys", () => {
      const locationKey = "CacheInterface_string__src_cache_ts_line_5";
      const result = keySanitizer.extractInterfaceNameFromLocationKey(locationKey);
      
      expect(result).toBe("CacheInterface_string");
    });
  });

  describe("extractLocationFromKey", () => {
    it("should extract file path and line number from location-based key", () => {
      const locationKey = "TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_26";
      const result = keySanitizer.extractLocationFromKey(locationKey);
      
      expect(result.filePath).toBe("src/todo/interfaces/TodoInterfaces.ts");
      expect(result.lineNumber).toBe(26);
    });

    it("should return empty object for standard keys", () => {
      const standardKey = "TodoServiceInterface";
      const result = keySanitizer.extractLocationFromKey(standardKey);
      
      expect(result).toEqual({});
    });

    it("should handle malformed location keys gracefully", () => {
      const malformedKey = "TodoServiceInterface__malformed";
      const result = keySanitizer.extractLocationFromKey(malformedKey);
      
      expect(result).toEqual({});
    });
  });

  describe("encodeFilePath", () => {
    it("should encode Windows file paths", () => {
      // Access private method via any casting for testing
      const result = (keySanitizer as any).encodeFilePath("C:\\Projects\\tdi2\\src\\services\\TodoService.ts");
      
      expect(result).toBe("src_services_TodoService_ts");
    });

    it("should handle relative paths", () => {
      const result = (keySanitizer as any).encodeFilePath("./src/components/Button.tsx");
      
      expect(result).toBe("src_components_Button_tsx");
    });

    it("should normalize various special characters", () => {
      const result = (keySanitizer as any).encodeFilePath("/project/src/weird-file.name@test.ts");
      
      expect(result).toBe("src_weird_file_name_test_ts");
    });
  });

  describe("Integration scenario: Interface name collision prevention", () => {
    it("should generate unique keys for interfaces with same name but different locations", () => {
      const todo1Key = keySanitizer.createLocationBasedKey(
        "TodoServiceInterface", 
        "/project/src/todo/interfaces/TodoInterfaces.ts", 
        26
      );
      
      const todo2Key = keySanitizer.createLocationBasedKey(
        "TodoServiceInterface", 
        "/project/src/todo2/types.ts", 
        15
      );
      
      expect(todo1Key).toBe("TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_26");
      expect(todo2Key).toBe("TodoServiceInterface__src_todo2_types_ts_line_15");
      expect(todo1Key).not.toBe(todo2Key);
    });

    it("should allow extraction of original interface name from both keys", () => {
      const todo1Key = "TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_26";
      const todo2Key = "TodoServiceInterface__src_todo2_types_ts_line_15";
      
      expect(keySanitizer.extractInterfaceNameFromLocationKey(todo1Key)).toBe("TodoServiceInterface");
      expect(keySanitizer.extractInterfaceNameFromLocationKey(todo2Key)).toBe("TodoServiceInterface");
    });

    it("should provide debugging information about key locations", () => {
      const todo1Key = "TodoServiceInterface__src_todo_interfaces_TodoInterfaces_ts_line_26";
      const todo2Key = "TodoServiceInterface__src_todo2_types_ts_line_15";
      
      const loc1 = keySanitizer.extractLocationFromKey(todo1Key);
      const loc2 = keySanitizer.extractLocationFromKey(todo2Key);
      
      expect(loc1.filePath).toBe("src/todo/interfaces/TodoInterfaces.ts");
      expect(loc1.lineNumber).toBe(26);
      
      expect(loc2.filePath).toBe("src/todo2/types.ts");
      expect(loc2.lineNumber).toBe(15);
    });
  });
});