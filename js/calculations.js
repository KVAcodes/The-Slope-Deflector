// The file contains the main calculations for the beam analysis

// the format of the received parameters is as follows
// 1.) Beam Length {float}
// 2.) Supports {array of support objects} e.g
// [{supportNo: 1, type: 'Roller', location: 0},{supportNo: 2, type: 'Hinge', location: 6},{supportNo: 3, type: 'Fixed', location: 12}]
// 3.) Sections {array  of section objects for each span(the rest of the section objects inherit the Moi and YoungMod properties of the first section object in the array)}
// [{Moi: null or value, YoungMod: null, Coefficient: 1},{Moi: null or value, YoungMod: null, Coefficient: 1}]
// 4.) Settlement {array of settlement values(non-negative) for each support}
// [12, 34, 23]
// 5.) pointLoads { array of point Load objects(non negative magnitude)}
// [{location: 0, magnitude: 12}, {location: 6, magnitude: 5}, {location: 12, magnitude: 24}]
// 6.) distributedLoads {array of distributed Load objects(non negative magnitude)}
// [{start: 3, end: 4, startMag: 15, endMag: 15},{start: 6, end: 8, startMag: 12, endMag: 0},
// {start: 0, end: 2, startMag: 30, endMag: 10}]
// 7.) Moments {array of moment objects(either positive or negative magnitude)}
// [{position: 12, magnitude: 19},{position: 10, magnitude: -12}]
// 8.) noOfSpans {a calculated no of spans}

// create a doc for the received parameters
/**
 * @param {float} beamLength
 * @param {array} supports
 * @param {array} sections
 * @param {array} settlements
 * @param {array} pointLoads
 * @param {array} distributedLoads
 * @param {array} moments
 * @param {int} noOfSpans
 */
let receivedParameters;

export function setParameters(params) {
  receivedParameters = params;
  console.log("Received parameters:", receivedParameters);
  // Perform further processing with the received parameters
  addFreeEndSupports();
  recalibrateSupports();
  const spans = splitBeamIntoSpans();
  const FixedEndMoments = calculateFixedEndMoments(spans);
}

// function to add free end supports to the supports array
// works on the support object such that if the location of the first support is not 0, 
// then add a new support object at location 0 with type 'Free end', and if the location 
// of the last support is not equal to the beam length, then add a new support object at the beam length with type 'Free end'
// The function returns the modified supports array
// The function also adds the corresponding settlement value to the settlements array
function addFreeEndSupports() {
  let supports = receivedParameters.supports;
  let beamLength = receivedParameters.beamLength;
  let settlements = receivedParameters.settlements;
  if (supports[0].location !== 0) {
    supports.unshift({ supportNo: 0, type: 'Free end', location: 0 });
    settlements.unshift(0);
  }
  if (supports[supports.length - 1].location !== beamLength) {
    supports.push({ supportNo: supports.length + 1, type: 'Free end', location: beamLength });
    settlements.push(0);
  }
  console.log("Supports with free ends:", supports);
  return supports;
}

// function to recalibrate the supports array
// it changes the supportNo property of each support object in the supports array, such that the supportNo property of the first support object is 1 and the supportNo property of the last support object is equal to the length of the supports array
function recalibrateSupports() {
  let supports = receivedParameters.supports;
  supports.forEach((support, index) => {
    support.supportNo = index + 1;
  });
  console.log("Recalibrated supports:", supports);
}

// S P L I T T I N G  B E A M S  I N T O  S P A N S

// The function splits the beam into spans
// The function returns an array of spans
// Each span is an object with the following properties
// 1.) spanNo {int} - the span number
// 2.) start {float} - the start location of the span
// 3.) end {float} - the end location of the span
// 4.) length {float} - the length of the span
// 5.) supports {array} - the supports in the span e.g [{supportNo: 1, type: 'Roller', location: 0},{supportNo: 2, type: 'Hinge', location: 6}] or [{supportNo: 1, type: 'Free end', location: 0},{supportNo: 2, type: 'Hinge', location: 6}, {supportNo: 3, type: 'Fixed', location: 12}]
// 6.) section of the span {object} - the section object of the span e.g {Moi: null or value, YoungMod: null, Coefficient: 1}
// 7.) settlements of the supports {array} - the settlements of the supports in the span e.g [12, 34]
// 8.) pointLoads in the span {array} - the point loads in the span e.g [{location: 0, magnitude: 12}, {location: 6, magnitude: 5}]
// 9.) distributedLoads in the span {array} - the distributed loads in the span e.g [{start: 3, end: 4, startMag: 15, endMag: 15},{start: 6, end: 8, startMag: 12, endMag: 0}]
// 10.) moments in the span {array} - the moments in the span e.g [{position: 12, magnitude: 19},{position: 10, magnitude: -12}]
// Note that: each span has varying length so it is important to calculate the length of each span by using the supports in the span

// The function also filters the point loads, distributed loads and moments in the span

// There are five cases to consider when filtering the distributed loads in the span
// 1.) The start and end of the distributed load are within the span, if so then include the distributed load in the span
// 2.) The start of the distributed load is within the span and the end is outside the span, if so change the end of the distributed load to the end of the span and include the distributed load in the span, for varying distributed loads, calculate the magnitude at the end of the span
// 3.) The start of the distributed load is outside the span and the end is within the span, if so change the start of the distributed load to the start of the span and include the distributed load in the span, for varying distributed loads, calculate the magnitude at the start of the span
// 4.) The start and end of the distributed load are outside the span, if so then exclude the distributed load from the span
// 5.) The start and end of the distributed load are outside the span, but the span length falls within the start and end of the distributed load, if so change the start and end of the distributed load to the start and end of the span and include the distributed load in the span and calculate the magnitude at the start and end of the span for varying distributed loads


function splitBeamIntoSpans() {
  let beamLength = receivedParameters.beamLength;
  let supports = receivedParameters.supports;
  let sections = receivedParameters.sections;
  let settlements = receivedParameters.settlements;
  let pointLoads = receivedParameters.pointLoads;
  let distributedLoads = receivedParameters.distributedLoads;
  let moments = receivedParameters.moments;
  let noOfSpans = receivedParameters.noOfSpans;
  let spans = [];

  // sort the supports array in ascending order of location
  supports.sort((a, b) => a.location - b.location);
  console.log("Sorted supports:", supports);

  for (let i = 0; i < noOfSpans; i++) {
    let span = {};
    span.spanNo = i + 1;
    span.start = supports[i].location;
    span.end = supports[i + 1].location;
    span.length = span.end - span.start;
    span.supports = [supports[i], supports[i + 1]];
    span.section = sections[i];
    span.settlements = [settlements[i], settlements[i + 1]];
    // filter the point loads in the span
    span.pointLoads = pointLoads.filter((load) => load.location >= span.start && load.location <= span.end);

    // filter the distributed loads in the span
    span.distributedLoads = distributedLoads.map((load) => {
      if (load.start >= span.start && load.end <= span.end) {
        return load;
      } else if (load.start >= span.start && load.end > span.end && load.start < span.end) {
        const newLoad = { ...load };
        newLoad.end = span.end;
        if (newLoad.startMag !== newLoad.endMag) {
          if (newLoad.startMag < newLoad.endMag) {
            if (newLoad.startMag === 0) {
              const x2 = load.end - load.start;
              const x1 = newLoad.end - load.start;
              const y2 = newLoad.endMag;
              const y1 = (x1 * y2) / x2;
              newLoad.endMag = y1;
            } else {
              const x2 = load.end - load.start;
              const x1 = newLoad.end - load.start;
              const y2 = newLoad.endMag - newLoad.startMag;
              const y1 = (x1 * y2) / x2;
              newLoad.endMag = newLoad.startMag + y1;
            }
          }
          if (newLoad.startMag > newLoad.endMag) {
            if (newLoad.endMag === 0) {
              const x2 = load.end - load.start;
              const x1 = load.end - newLoad.end;
              const y2 = newLoad.startMag;
              const y1 = (x1 * y2) / x2;
              newLoad.endMag = y1;
            } else {
              const x2 = load.end - load.start;
              const x1 = load.end - newLoad.end;
              const y2 = newLoad.startMag - newLoad.endMag;
              const y1 = (x1 * y2) / x2;
              newLoad.endMag = newLoad.endMag + y1;
            }
          }
        }
        return newLoad;
      } else if (load.start < span.start && load.end <= span.end && load.end > span.start) {
        const newLoad = { ...load };
        newLoad.start = span.start;
        if (newLoad.startMag !== newLoad.endMag) {
          if (newLoad.startMag < newLoad.endMag) {
            if (newLoad.startMag === 0) {
              const x2 = load.end - load.start;
              const x1 = newLoad.start - load.start;
              const y2 = newLoad.endMag;
              const y1 = (x1 * y2) / x2;
              newLoad.startMag = y1;
            } else {
              const x2 = load.end - load.start;
              const x1 = newLoad.start - load.start;
              const y2 = newLoad.endMag - newLoad.startMag;
              const y1 = (x1 * y2) / x2;
              newLoad.startMag = newLoad.startMag + y1;
            }
          }
          if (newLoad.startMag > newLoad.endMag) {
            if (newLoad.endMag === 0) {
              const x2 = load.end - load.start;
              const x1 = load.end - newLoad.start;
              const y2 = newLoad.startMag;
              const y1 = (x1 * y2) / x2;
              newLoad.startMag = y1;
            } else {
              const x2 = load.end - load.start;
              const x1 = load.end - newLoad.start;
              const y2 = newLoad.startMag - newLoad.endMag;
              const y1 = (x1 * y2) / x2;
              newLoad.startMag = newLoad.endMag + y1;
            }
          }
        }
        return newLoad;
      } else if (load.start < span.start && load.end > span.end && load.start < span.end) {
        const newLoad = { ...load };
        newLoad.start = span.start;
        newLoad.end = span.end;
        if (newLoad.startMag !== newLoad.endMag) {
          if (newLoad.startMag < newLoad.endMag) {
            if (newLoad.startMag === 0) {
              const x1a = newLoad.start - load.start;
              const x1b = newLoad.end - load.start;
              const x2 = load.end - load.start;
              const y2 = newLoad.endMag;
              const y1a = (x1a * y2) / x2;
              const y1b = (x1b * y2) / x2;
              newLoad.startMag = y1a;
              newLoad.endMag = y1b;
            } else {
              const x1a = newLoad.start - load.start;
              const x1b = newLoad.end - load.start;
              const x2 = load.end - load.start;
              const y2 = newLoad.endMag - newLoad.startMag;
              const y1a = (x1a * y2) / x2;
              const y1b = (x1b * y2) / x2;
              newLoad.endMag = newLoad.startMag + y1b;
              newLoad.startMag = newLoad.startMag + y1a;
            }
          }
          if (newLoad.startMag > newLoad.endMag) {
            if (newLoad.endMag === 0) {
              const x1a = load.end - newLoad.end
              const x1b = load.end - newLoad.start;
              const x2 = load.end - load.start;
              const y2 = newLoad.startMag;
              const y1a = (x1a * y2) / x2;
              const y1b = (x1b * y2) / x2;
              newLoad.startMag = y1b;
              newLoad.endMag = y1a;
            } else {
              const x1a = load.end - newLoad.end;
              const x1b = load.end - newLoad.start;
              const x2 = load.end - load.start;
              const y2 = newLoad.startMag - newLoad.endMag;
              const y1a = (x1a * y2) / x2;
              const y1b = (x1b * y2) / x2;
              newLoad.startMag = newLoad.endMag + y1b;
              newLoad.endMag = newLoad.endMag + y1a;
            }
          }
        }
        return newLoad;
      }
    });
    span.moments = moments.filter((moment) => moment.position >= span.start && moment.position <= span.end);
    spans.push(span);
  }
  console.log("Spans:", spans);
  return spans;
}

// F I X E D  E N D  M O M E N T S  C A L C U L A T I O N S  I N T E G R A T I O N  and  S U P E R P O S I T I O N 

// The function calculates the fixed end moments for each span

// The function returns an array of fixed end moments objects for each span in the beam. E.g [{spanNo: 1, M+"{span.supports[0].supportNo}"+"span.{supports[1].supportNo}": 12, M+"{span.supports[1].supportNo}"+"span.{supports[0].supportNo}": -12}, {spanNo: 2, M+"{span.supports[0].supportNo}"+"span.{supports[1].supportNo}": 12, M+"{span.supports[1].supportNo}"+"span.{supports[0].supportNo}": -12}]
// The fixed end moments are calculated using the following steps
// 1.) check if the span has a free end support, if so then calculate the fixed end moment for the spans with a free end, if span has no free end support then calculate the fixed end moments for the spans with fixed end supports

// create a template for the function to calculate the fixed end moments


function calculateFixedEndMoments(spans) {
  let femArray = [];
  spans.forEach((span) => {
    if (span.supports[0].type === 'Free end' || span.supports[1].type === 'Free end') {
      // calculate the fixed end moments for the spans with a free end
      if (span.supports[0].type === 'Free end') {
        femArray.push(calculateFixedEndMomentsForLeftFreeEndSpans(span));
      } else {
        femArray.push(calculateFixedEndMomentsForRightFreeEndSpans(span));
      }
    } else {
      // calculate the fixed end moments for the spans with fixed end supports
      femArray.push(calculateFixedEndMomentsForFixedEndSpans(span));
    }

  });
  console.log("Fixed end moments:", femArray);
  return femArray;
}

// function to calculate the fixed end moments for the spans with a free end support at the left end
// The function returns an object with the fixed end moments for the span
// The object has the following properties which differs from the other fixed end moments objects, by the fact that the span has a free end support at the left end and at that end, the fixed end moment is zero
// 1.) spanNo {int} - the span number
// 2.) M+"{span.supports[1].supportNo}"+"span.{supports[0].supportNo} {float} - the fixed end moment at the right end of the span
// It is found for the following loading conditions for every load in the span
// 1.) point loads - the fixed end moment is equal to the magnitude of the point load multiplied by the distance from the point load to the right end of the span
// 2.) distributed loads - the fixed end moment is equal to the area of the distributed load diagram multiplied by the distance from the centroid of the distributed load diagram to the right end of the span
// 3.) moments - the fixed end moment is given by a formula to be provided later
function calculateFixedEndMomentsForLeftFreeEndSpans(span) {
  let fem = {};
  fem.spanNo = span.spanNo;
  fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] = 0;
  span.pointLoads.forEach((load) => {
    fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += load.magnitude * (span.end - load.location);
  });
  span.distributedLoads.forEach((load) => {
    if (load) {
      if (load.startMag === load.endMag) {
        const midLoadpoint = (load.start + load.end) / 2;
        const midLoadToEnd = span.end - midLoadpoint;
        fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += load.startMag * midLoadToEnd * (load.end - load.start);
      } else {
        if (load.startMag < load.endMag) {
          if (load.startMag === 0) {
            const base = load.end - load.start;
            const height = load.endMag;
            const area = (base * height) / 2;
            const centroid = (1 / 3 * base) + (span.end - load.end);
            fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += (area * centroid);
          } else {
            const base = load.end - load.start;
            const triheight = load.endMag - load.startMag;
            const recheight = load.startMag;
            const triarea = (base * triheight) / 2;
            const recarea = base * recheight;
            const tricentroid = (1 / 3 * base) + (span.end - load.end);
            const reccentroid = (1 / 2 * base) + (span.end - load.end);
            fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += (triarea * tricentroid) + (recarea * reccentroid);
          }

        }
        if (load.startMag > load.endMag) {
          if (load.endMag === 0) {
            const base = load.end - load.start;
            const height = load.startMag;
            const area = (base * height) / 2;
            const centroid = (2 / 3 * base) + (span.end - load.end);
            fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += (area * centroid);
          } else {
            const base = load.end - load.start;
            const triheight = load.startMag - load.endMag;
            const recheight = load.endMag;
            const triarea = (base * triheight) / 2;
            const recarea = base * recheight;
            const tricentroid = (2 / 3 * base) + (span.end - load.end);
            const reccentroid = (1 / 2 * base) + (span.end - load.end);
            fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += (triarea * tricentroid) + (recarea * reccentroid);
          }
        }
      }
    }

  });
  span.moments.forEach((moment) => {
    fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += moment.magnitude;
  });
  return fem;
}

// function to calculate the fixed end moments for the spans with a free end support at the right end
// The function returns an object with the fixed end moments for the span
// The object has the following properties which differs from the other fixed end moments objects, by the fact that the span has a free end support at the right end and at that end, the fixed end moment is zero
// 1.) spanNo {int} - the span number
// 2.) M+"{span.supports[0].supportNo}"+"span.{supports[1].supportNo} {float} - the fixed end moment at the left end of the span
// It is found for the following loading conditions for every load in the span
// 1.) point loads - the fixed end moment is equal to the magnitude of the point load multiplied by the distance from the point load to the left end of the span
// 2.) distributed loads - the fixed end moment is equal to the area of the distributed load diagram multiplied by the distance from the centroid of the distributed load diagram to the left end of the span
// 3.) moments - the fixed end moment is given by a formula to be provided later

function calculateFixedEndMomentsForRightFreeEndSpans(span) {
  let fem = {};
  fem.spanNo = span.spanNo;
  fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] = 0;
  span.pointLoads.forEach((load) => {
    fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(load.magnitude * (load.location - span.start));
  });
  span.distributedLoads.forEach((load) => {
    if (load) {
      if (load.startMag === load.endMag) {
        const midLoadpoint = (load.start + load.end) / 2;
        const midLoadToEnd = midLoadpoint - span.start;
        fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(load.startMag * midLoadToEnd * (load.end - load.start));
      } else {
        if (load.startMag < load.endMag) {
          if (load.startMag === 0) {
            const base = load.end - load.start;
            const height = load.endMag;
            const area = (base * height) / 2;
            const centroid = (2 / 3 * base) + (load.start - span.start);
            fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(area * centroid);
          } else {
            const base = load.end - load.start;
            const triheight = load.endMag - load.startMag;
            const recheight = load.startMag;
            const triarea = (base * triheight) / 2;
            const recarea = base * recheight;
            const tricentroid = (2 / 3 * base) + (load.start - span.start);
            const reccentroid = (1 / 2 * base) + (load.start - span.start);
            fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(triarea * tricentroid) - (recarea * reccentroid);
          }

        }
        if (load.startMag > load.endMag) {
          if (load.endMag === 0) {
            const base = load.end - load.start;
            const height = load.startMag;
            const area = (base * height) / 2;
            const centroid = (1 / 3 * base) + (load.start - span.start);
            console.log(area, centroid); // remove later
            fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(area * centroid);
          }
          else {
            const base = load.end - load.start;
            const triheight = load.startMag - load.endMag;
            const recheight = load.endMag;
            const triarea = (base * triheight) / 2;
            const recarea = base * recheight;
            const tricentroid = (1 / 3 * base) + (load.start - span.start);
            const reccentroid = (1 / 2 * base) + (load.start - span.start);
            fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += -(triarea * tricentroid) - (recarea * reccentroid);
          }
        }
      }
    }
  }
  );
  span.moments.forEach((moment) => {
    fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += moment.magnitude;
  });
  return fem;
}

// function to calculate the fixed end moments for the spans with no free end supports at both ends, in this case the fixed end moments are calculated for the following loading conditions for every load in the span
// 1.) point Loads - is done by the formula to be provided later
// 2.) distributed loads - is done by integrating each elemental load of the distributed load diagram to find the fixed end moment, integration to be done using the math.js library
// 3.) moments - the fixed end moment is given by a formula to be provided later

function calculateFixedEndMomentsForFixedEndSpans(span) {
  let fem = {};
  fem.spanNo = span.spanNo;
  fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] = 0;
  fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] = 0;
  span.pointLoads.forEach((load) => {
    // each point load has a fixed end moment at both ends of the span,
    // for the left end (i.e M12) the formula is given by the following formula, M12 = +((P * a * b^2)/l^2)
    // for the right end (i.e M21) the formula is given by the following formula, M21 = -((P * b * a^2)/l^2)
    // where P is the magnitude of the point load, a is the distance from the point load to the left end of the span, b is the distance from the point load to the right end of the span, and l is the length of the span
    const a = load.location - span.start;
    const b = span.end - load.location;
    const l = span.length;
    const p = load.magnitude;
    fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += ((p * a * b * b) / (l * l));
    fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -((p * b * a * a) / (l * l));
  });
  span.distributedLoads.forEach((load) => {
    if (load) {
      if (load.startMag === load.endMag) {
        // for distributed loads we are taking an integral approach based on the formulas using the pointLoads approach
        // to find the left end (i.e M12), we take the integral of the expression ((y* x * (l-x)^2)/l^2) from a to b, where y is the elemental load, x is the distance from the left end of the span, l is the length of the span, a is the start of the distributed load, and b is the end of the distributed load.
        // for the right end (i.e M21), we take the negative of the integral of the expression ((y * (l-x) * x^2)/l^2) from a to b, where y is the elemental load, x is the distance from the left end of the span, l is the length of the span, a is the start of the distributed load, and b is the end of the distributed load.
        // for udl, y = pdx, where p is the magnitude of the udl, and dx is the elemental load
        const a = load.start - span.start;
        const b = load.end - span.start;
        const l = span.length;
        const p = load.startMag;
        // using the nerdamer library instead to integrate the expression
        // syntax: nerdamer('defint(e^(cos(x)), 1, 2)');

        const expressionLeft = `(${p} * x * (${l} - x)^2)/${l}^2`;
        console.log(expressionLeft);
        const integralforleftFEM = parseFloat(nerdamer(`defint(${expressionLeft}, ${a}, ${b})`).text());
        fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
        const expressionRight = `(${p} * (${l} - x) * x^2)/${l}^2`;
        const integralforrightFEM = parseFloat(nerdamer(`defint(${expressionRight}, ${a}, ${b})`).text());
        fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;
      }
      if (load.startMag < load.endMag) {
        if (load.startMag === 0) {
          // for varying distributed loads, we are taking an integral approach based on the formulas using the pointLoads approach also
          // for vdl, y is found by the equation of the line y = mx + c.
          // to find the equation for load.startMag < load.endMag, we use the expression(derived from similar triangles) y = (p*(x - a))/(b - a), where p is endMag of the vdl, x is the distance from the left end of the span(variable), a is the distance to the start of the distributed load, and b is distance to the end of the distributed load.
          // find y in terms of x,
          // for the left end (i.e M12), we take the integral of the expression ((y* x * (l-x)^2)/l^2) from a to b, where y is the elemental load, x is the distance from the left end of the span, l is the length of the span, a is the start of the distributed load, and b is the end of the distributed load.
          // for the right end (i.e M21), we take the negative of the integral of the expression ((y * (l-x) * x^2)/l^2) from a to b, where y is the elemental load, x is the distance from the left end of the span, l is the length of the span, a is the start of the distributed load, and b is the end of the distributed load.
          const a = load.start - span.start;
          const b = load.end - span.start;
          const l = span.length;
          const p = load.endMag;
          const expression = `(${p} * (x - ${a})) / (${b} - ${a})`;
          console.log(expression);
          const integralforleftFEM = parseFloat(nerdamer(`defint((${expression} * x * (${l} - x)^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          const integralforrightFEM = parseFloat(nerdamer(`defint((${expression} * (${l} - x) * x^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;

          // const simplifiedExpression = math.simplify(expression);
          // const integralforleftFEM = math.integral(`((${simplifiedExpression} * x * (${l} - x)^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          // const integralforrightFEM = math.integral(`((${simplifiedExpression} * (${l} - x) * x^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;
        } else {
          // here y = ((p2-p1)*(x-a)/(b-a)) + p1, where p1 is startMag and p2 is endMag, x is the distance from the left end of the span(variable), a is the distance to the start of the distributed load, and b is distance to the end of the distributed load.
          const a = load.start - span.start;
          const b = load.end - span.start;
          const l = span.length;
          const p1 = load.startMag;
          const p2 = load.endMag;
          const expression = `((${p2} - ${p1})*(x - ${a})/(${b} - ${a})) + ${p1}`;
          console.log(expression);
          const integralforleftFEM = parseFloat(nerdamer(`defint((${expression} * x * (${l} - x)^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          const integralforrightFEM = parseFloat(nerdamer(`defint((${expression} * (${l} - x) * x^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;

          // const simplifiedExpression = math.simplify(expression);
          // const integralforleftFEM = math.integral(`((${simplifiedExpression} * x * (${l} - x)^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          // const integralforrightFEM = math.integral(`((${simplifiedExpression} * (${l} - x) * x^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;
        }
      }
      if (load.startMag > load.endMag) {
        if (load.endMag === 0) {
          // here y = (p*(b-x)/(b-a)), where p is startMag of the vdl, x is the distance from the left end of the span(variable), a is the distance to the start of the distributed load, and b is distance to the end of the distributed load.
          const a = load.start - span.start;
          const b = load.end - span.start;
          const l = span.length;
          const p = load.startMag;
          const expression = `(${p} * (${b} - x)/(${b}-${a}))`;
          console.log(expression);
          const integralforleftFEM = parseFloat(nerdamer(`defint((${expression} * x * (${l} - x)^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          const integralforrightFEM = parseFloat(nerdamer(`defint((${expression} * (${l} - x) * x^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;

          // const simplifiedExpression = math.simplify(expression);
          // const integralforleftFEM = math.integral(`((${simplifiedExpression} * x * (${l} - x)^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          // const integralforrightFEM = math.integral(`((${simplifiedExpression} * (${l} - x) * x^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;
        }
        else {
          // here y = ((p2-p1)*(b-x)/(b-a)) + p1, where p2 is startMag and p1 is endMag, x is the distance from the left end of the span(variable), a is the distance to the start of the distributed load, and b is distance to the end of the distributed load.
          const a = load.start - span.start;
          const b = load.end - span.start;
          const l = span.length;
          const p1 = load.endMag;
          const p2 = load.startMag;
          const expression = `((${p2} - ${p1})*(${b}-x)/(${b}-${a})) + ${p1}`;
          console.log(expression);
          const integralforleftFEM = parseFloat(nerdamer(`defint((${expression} * x * (${l} - x)^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          const integralforrightFEM = parseFloat(nerdamer(`defint((${expression} * (${l} - x) * x^2)/${l}^2, ${a}, ${b})`).text());
          fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;

          // const simplifiedExpression = math.simplify(expression);
          // const integralforleftFEM = math.integral(`((${simplifiedExpression} * x * (${l} - x)^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += integralforleftFEM;
          // const integralforrightFEM = math.integral(`((${simplifiedExpression} * (${l} - x) * x^2)/${l}^2)`, 'x', a, b);
          // fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += -integralforrightFEM;
        }
      }
    }
  });
span.moments.forEach((moment) => {
  // each moment has a fixed end moment at both ends of the span,
  // for the left end (i.e M12) the formula is given by the following formula, M12 = (M*b*(2a - b))/(l^2)
  // for the right end (i.e M21) the formula is given by the following formula, M21 = (M*a*(2b - a))/(l^2)
  // where M is the magnitude of the moment, a is the distance from the moment to the left end of the span, b is the distance from the moment to the right end of the span, and l is the length of the span
  const a = moment.position - span.start;
  const b = span.end - moment.position;
  const l = span.length;
  const M = moment.magnitude;
  fem[`M${span.supports[0].supportNo}${span.supports[1].supportNo}`] += (M * b * (2 * a - b)) / (l * l);
  fem[`M${span.supports[1].supportNo}${span.supports[0].supportNo}`] += (M * a * (2 * b - a)) / (l * l);
});
return fem;
}