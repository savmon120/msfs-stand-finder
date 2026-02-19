# Stand Mapping Configuration

Maps real-world stand names to simulator scenery stand names.

## Format

```json
{
  "AIRPORT_ICAO": {
    "REAL_WORLD_NAME": ["scenery_name_1", "scenery_name_2", ...]
  }
}
```

## Example

```json
{
  "EGLL": {
    "A10": ["A10", "A010", "Gate A10"],
    "B32": ["B32", "532", "Stand 532"]
  }
}
```

## Scenery Providers

- `default`: Generic MSFS/P3D/XP scenery
- `MSFS_default`: Default MSFS scenery
- `FlyTampa_EGLL`: FlyTampa Heathrow
- `IniBuilds_EGLL`: IniBuilds Heathrow
- `GSX_default`: GSX Pro parking positions

## Contributing

To contribute stand mappings:

1. Create or edit the airport JSON file
2. Test with your scenery
3. Submit a pull request
4. Include scenery package details

## Automated Detection

Future versions will support:
- MSFS scenery package scanning
- BGL parsing
- GSX profile reading
- Automatic mapping suggestions
