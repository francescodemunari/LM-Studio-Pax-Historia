const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', '..', 'data', 'hoi4_map.json');

function parsePathToLatLngs(d, height) {
    const rings = [];
    let currentRing = [];

    const commands = d.match(/[a-df-z][^a-df-z]*/ig);
    let currX = 0, currY = 0;
    let lastControlX = 0, lastControlY = 0;

    if (!commands) return [];

    const closeRing = () => {
        if (currentRing.length > 0) {
            rings.push(currentRing);
            currentRing = [];
        }
    };

    const addPoint = (x, y) => {
        if (!isNaN(x) && !isNaN(y)) {
            currentRing.push([height - y, x]);
        }
    };

    commands.forEach(cmd => {
        const type = cmd[0];
        const isRelative = type === type.toLowerCase();
        const args = cmd.slice(1).match(/[+-]?(\d*\.\d+|\d+)/g)?.map(Number) || [];

        let newLastControlX = currX;
        let newLastControlY = currY;

        switch (type.toUpperCase()) {
            case 'M':
                closeRing();
                if (args.length >= 2) {
                    let x = args[0];
                    let y = args[1];
                    if (isRelative) { x += currX; y += currY; }
                    currX = x; currY = y;
                    addPoint(currX, currY);

                    for (let i = 2; i < args.length; i += 2) {
                        let lx = args[i];
                        let ly = args[i + 1];
                        if (isRelative) { lx += currX; ly += currY; }
                        currX = lx; currY = ly;
                        addPoint(currX, currY);
                    }
                }
                newLastControlX = currX; newLastControlY = currY;
                break;

            case 'L':
                for (let i = 0; i < args.length; i += 2) {
                    let x = args[i];
                    let y = args[i + 1];
                    if (isRelative) { x += currX; y += currY; }
                    currX = x; currY = y;
                    addPoint(currX, currY);
                }
                newLastControlX = currX; newLastControlY = currY;
                break;

            case 'H':
                args.forEach(x => {
                    if (isRelative) x += currX;
                    currX = x;
                    addPoint(currX, currY);
                });
                newLastControlX = currX; newLastControlY = currY;
                break;

            case 'V':
                args.forEach(y => {
                    if (isRelative) y += currY;
                    currY = y;
                    addPoint(currX, currY);
                });
                newLastControlX = currX; newLastControlY = currY;
                break;

            case 'Z':
                closeRing();
                break;

            case 'Q':
                for (let i = 0; i < args.length; i += 4) {
                    let cx = args[i], cy = args[i + 1];
                    let ex = args[i + 2], ey = args[i + 3];
                    if (isRelative) { cx += currX; cy += currY; ex += currX; ey += currY; }

                    for (let t = 0.1; t < 0.95; t += 0.1) {
                        let mt = 1 - t;
                        let midX = mt * mt * currX + 2 * mt * t * cx + t * t * ex;
                        let midY = mt * mt * currY + 2 * mt * t * cy + t * t * ey;
                        addPoint(midX, midY);
                    }
                    addPoint(ex, ey);

                    currX = ex; currY = ey;
                    newLastControlX = cx; newLastControlY = cy;
                }
                break;

            case 'C':
                for (let i = 0; i < args.length; i += 6) {
                    let c1x = args[i], c1y = args[i + 1];
                    let c2x = args[i + 2], c2y = args[i + 3];
                    let ex = args[i + 4], ey = args[i + 5];
                    if (isRelative) { c1x += currX; c1y += currY; c2x += currX; c2y += currY; ex += currX; ey += currY; }

                    for (let t = 0.1; t < 0.95; t += 0.1) {
                        let mt = 1 - t;
                        let midX = mt * mt * mt * currX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
                        let midY = mt * mt * mt * currY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;
                        addPoint(midX, midY);
                    }
                    addPoint(ex, ey);

                    currX = ex; currY = ey;
                    newLastControlX = c2x; newLastControlY = c2y;
                }
                break;

            case 'S':
                for (let i = 0; i < args.length; i += 4) {
                    let c2x = args[i], c2y = args[i + 1];
                    let ex = args[i + 2], ey = args[i + 3];
                    if (isRelative) { c2x += currX; c2y += currY; ex += currX; ey += currY; }

                    let c1x = 2 * currX - lastControlX;
                    let c1y = 2 * currY - lastControlY;

                    for (let t = 0.1; t < 0.95; t += 0.1) {
                        let mt = 1 - t;
                        let midX = mt * mt * mt * currX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
                        let midY = mt * mt * mt * currY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;
                        addPoint(midX, midY);
                    }
                    addPoint(ex, ey);

                    currX = ex; currY = ey;
                    newLastControlX = c2x; newLastControlY = c2y;
                }
                break;

            case 'T':
                for (let i = 0; i < args.length; i += 2) {
                    let ex = args[i], ey = args[i + 1];
                    if (isRelative) { ex += currX; ey += currY; }

                    let cx = 2 * currX - lastControlX;
                    let cy = 2 * currY - lastControlY;

                    for (let t = 0.1; t < 0.95; t += 0.1) {
                        let mt = 1 - t;
                        let midX = mt * mt * currX + 2 * mt * t * cx + t * t * ex;
                        let midY = mt * mt * currY + 2 * mt * t * cy + t * t * ey;
                        addPoint(midX, midY);
                    }
                    addPoint(ex, ey);

                    currX = ex; currY = ey;
                    newLastControlX = cx; newLastControlY = cy;
                }
                break;
        }
        lastControlX = newLastControlX;
        lastControlY = newLastControlY;
    });

    closeRing();
    return rings;
}

try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    const viewBox = mapData.viewBox.split(' ').map(Number);
    const svgH = viewBox[3];

    console.log(`Checking ${mapData.regions.length} regions with NEW multipolygon/curve parser...`);

    let errorCount = 0;
    let totalRings = 0;

    mapData.regions.forEach((region, index) => {
        try {
            const rings = parsePathToLatLngs(region.path, svgH);
            if (rings.length === 0) {
                // Some regions might be empty but valid? No, usually not.
                // console.log(`Region ${region.id} has no rings.`);
            }
            totalRings += rings.length;

            // Check for NaN deep
            let hasNan = false;
            rings.forEach(ring => {
                ring.forEach(pt => {
                    if (isNaN(pt[0]) || isNaN(pt[1])) hasNan = true;
                });
            });

            if (hasNan) {
                console.error(`Region ${region.id} has NaN results.`);
                errorCount++;
            }

        } catch (e) {
            console.error(`Region ${region.id} crashed the parser: ${e.message}`);
            errorCount++;
        }
    });

    console.log(`Validation complete.`);
    console.log(`Total Errors: ${errorCount}`);
    console.log(`Total Polygon Rings Generated: ${totalRings}`);

} catch (err) {
    console.error('Error reading map data:', err);
}
