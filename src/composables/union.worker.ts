import { GeoJSONReader, GeoJSONWriter } from 'jsts/org/locationtech/jts/io';
import { UnaryUnionOp } from 'jsts/org/locationtech/jts/operation/union';
import { GeometryFactory } from "jsts/org/locationtech/jts/geom";


self.onmessage = (e: MessageEvent) =>  {    
    const factory = new GeometryFactory();
    const reader = new GeoJSONReader(factory);
    
    const geometry = reader.read(e.data);
    const unioned = UnaryUnionOp.union(geometry);

    const writer = new GeoJSONWriter();
    const result = writer.write(unioned);
    self.postMessage(result);
}