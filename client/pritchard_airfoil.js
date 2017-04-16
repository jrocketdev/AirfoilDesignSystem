/*
 *  A javascript Pritchard Airfoil library
 *
 *  Created by Jonathan on 2/25/2017.
 *

Input Variables for Pritchard Airfoil:
    r:          Radius
    cx:         Axial Chord
    ct:         Tangential Chord
    uct:        Uncovered (Unguided Turning) [radians]
    b1:         Inlet Blade Inlet [radians]
    db1:        Inlet Wedge Angle [radians]
    rle:        Leading Edge Radius
    b2:         Exit Blade Angle [radians]
    rte:        Trailing Edge Radius
    nb:         Number of Blades
    o:          Throat

Extra Variable Calculations (as methods):
    s():        Pitch calculation
    stagger():  Stagger Angle
    zweifel():  Incompressible Zweifel Loading Coefficient
    c():        Chord, Polynomial Coefficient
    solidity(): Solidity
    lift():     Lift Coefficient

Useful Methods:
    toString():     Returns a string with independent and dependant variables of the foil.

 */

var default_pritchard_params = {
    r: 5.5,
    cx: 1.102,
    ct: 0.591,
    uct: 6.5*Math.PI/180.0,
    b1: 35.0*Math.PI/180.0,
    db1: 16.0*Math.PI/180.0,
    rle: 0.031,
    b2: -57.0*Math.PI/180.0,
    rte: 0.016,
    nb: 51,
    o: 0.337
};

function PritchardAirfoil(parameters) {
    // Inputs
    this.r = parameters.r;
    this.cx = parameters.cx;
    this.ct = parameters.ct;
    this.uct = parameters.uct;
    this.b1 = parameters.b1;
    this.db1 = parameters.db1;
    this.rle = parameters.rle;
    this.b2 = parameters.b2;
    this.rte = parameters.rte;
    this.nb = parameters.nb;
    this.o = parameters.o;

    // Dependent Variabls
    this.s = function() { return 2.0*Math.PI*this.r/this.nb; };
    this.stagger = function() { return Math.atan2(this.ct, this.cx); };
    this.c = function() { return Math.sqrt(this.cx*this.cx + this.ct*this.ct) };
    this.zweifel = function() {
        return 4*Math.PI*this.r/(this.cx*this.nb)*Math.sin(this.b1-this.b2)*Math.cos(this.b2)/Math.cos(this.b1)
    };
    this.solidity = function() {return this.c()/this.s(); };
    this.lift = function() {
        return 2*this.s()/this.c()*0.5*(Math.cos(this.b1) + Math.cos(this.b2))*(Math.tan(this.b1) - Math.tan(this.b2));
    };
    this.db2 = this.uct;

    // Geom Vars
    this.num_points = 50;
    this.le_pts = null;
    this.te_pts = null;
    this.ps_pts = null;
    this.ss_pts = null;
    this.thrt_pts = null;
    this.pt1 = null;
    this.pt2 = null;
    this.pt3 = null;
    this.pt4 = null;
    this.pt5 = null;

    // Complete the airfoil by calculating all variables.
    this.calc_airfoil();
}

PritchardAirfoil.prototype.calc_airfoil = function() {
    this.find_db2();

    this.calc_pt1();
    this.calc_pt2();
    this.calc_pt3();
    this.calc_pt4();
    this.calc_pt5();

    this.calc_le();
    this.calc_te();
    this.calc_ss();
    this.calc_ps();
    this.calc_thrt();
};

PritchardAirfoil.prototype.calc_pt1 = function() {
    var b1 = this.b2 - this.db2/2.0;
    var x1 = this.cx - this.rte*(1 + Math.sin(b1));
    var y1 = this.rte*Math.cos(b1);
    this.pt1 = {x: x1, y: y1, b: b1};
};

PritchardAirfoil.prototype.calc_pt2 = function() {
    var b2 = this.b2 - this.db2/2.0 + this.uct;
    var x2 = this.cx - this.rte + (this.o + this.rte)*Math.sin(b2);
    var y2 = 2.0*Math.PI*this.r/this.nb - (this.o + this.rte)*Math.cos(b2);
    this.pt2 = {x: x2, y: y2, b: b2};
};

PritchardAirfoil.prototype.calc_pt3 = function() {
    var b3 = this.b1 + this.db1/2.0;
    var x3 = this.rle*(1 - Math.sin(b3));
    var y3 = this.ct + this.rle*Math.cos(b3);
    this.pt3 = {x: x3, y: y3, b: b3};
};

PritchardAirfoil.prototype.calc_pt4 = function() {
    var b4 = this.b1 - this.db1/2.0;
    var x4 = this.rle*(1 + Math.sin(b4));
    var y4 = this.ct - this.rle*Math.cos(b4);
    this.pt4 = {x: x4, y: y4, b: b4};
};

PritchardAirfoil.prototype.calc_pt5 = function() {
    var b5 = this.b2 + this.db2/2.0;
    var x5 = this.cx - this.rte*(1 - Math.sin(b5));
    var y5 = -this.rte*Math.cos(b5);
    this.pt5 = {x: x5, y: y5, b: b5};
};

PritchardAirfoil.prototype.calc_le = function() {
    var t_start = this.b1 + this.db1/2.0 + Math.PI/2.0;
    var t_end = 2*Math.PI + (this.b1 - this.db1/2.0 - Math.PI/2.0);
    var dt = (t_end - t_start)/(this.num_points - 1);
    var pts = [];
    var new_x, new_y;
    for (i=0; i<this.num_points; i++){
        new_x = this.rle*Math.cos(t_start + dt*i) + this.rle;
        new_y = this.rle*Math.sin(t_start + dt*i) + this.ct;
        pts.push({x: new_x, y: new_y});
    }
    this.le_pts = pts;
};

PritchardAirfoil.prototype.calc_te = function() {
    var t_start = this.b2 - this.db2/2.0 + Math.PI/2.0;
    var t_end = this.b2 + this.db1/2.0 - Math.PI/2.0;
    var dt = (t_end - t_start)/(this.num_points - 1);
    var pts = [];
    var new_x, new_y;
    for (i=0; i<this.num_points; i++){
        new_x = this.rte*Math.cos(t_start + dt*i) + this.cx - this.rte;
        new_y = this.rte*Math.sin(t_start + dt*i);
        pts.push({x: new_x, y: new_y});
    }
    this.te_pts = pts;
};

PritchardAirfoil.prototype.calc_ps = function() {
    this.ps_pts = cubic_points_from_endpoints(this.num_points, this.pt4, this.pt5)
};

PritchardAirfoil.prototype.calc_ss = function() {
    this.ss_pts = cubic_points_from_endpoints(this.num_points, this.pt3, this.pt2);
};

PritchardAirfoil.prototype.calc_thrt = function() {
    var thrt_funcs = arc_func_from_pts(this.pt1, this.pt2);
    var dt = 1.0/(this.num_points - 1);
    var pts = []
    for (i=0; i < this.num_points; i++){
        pts.push({x: thrt_funcs.x(i*dt), y: thrt_funcs.y(i*dt)});
    }
    this.thrt_pts = pts
};

PritchardAirfoil.prototype.db2_error_func = function(){
    var args = [this.b2, this.cx, this.rte, this.uct, this.o, this.r, this.nb];
    var f = function(db2, args) {
        b2 = args[0];
        cx = args[1];
        rte = args[2];
        uct = args[3];
        o = args[4];
        r = args[5];
        nb = args[6];
        var b1 = b2 - db2/2.0;
        var x1 = cx - rte*(1 + Math.sin(b1));
        var y1 = rte*Math.cos(b1);
        var pt1 = {x: x1, y: y1, b: b1};
        var b2 = b2 - db2/2.0 + uct;
        var x2 = cx - rte + (o + rte)*Math.sin(b2);
        var y2 = 2.0*Math.PI*r/nb - (o + rte)*Math.cos(b2);
        var pt2 = {x: x2, y: y2, b: b2};
        var arc_func = arc_func_from_pts(pt1, pt2);
        return (arc_func.y(0.0) - pt1.y) + (arc_func.y(1.0) - pt2.y);
    }
    return function(db2) {return f(db2, args)};
}

PritchardAirfoil.prototype.find_db2 = function() {
    var f = this.db2_error_func();
    [converged, value, sequence] = newton(this.db2, f, this.uct/10.0, this.uct*3.0);
    // console.log(value);
    if (converged){
        this.db2 = value;
    } else {
        this.db2 = this.uct;
    }
};

PritchardAirfoil.prototype.get_extents = function() {
    return [-2.0*(this.rte), d3.max([this.ct, (this.cx + this.rte)])];
}

PritchardAirfoil.prototype.update_val = function(key, value){
    switch (key){
        case 'r':
            this.r = value;
            break;
        case 'cx':
            this.cx = value;
            break;
        case 'ct':
            this.ct = value;
            break;
        case 'uct':
            this.uct = value;
            break;
        case 'b1':
            this.b1 = value;
            break;
        case 'db1':
            this.db1 = value;
            break;
        case 'rle':
            this.rle = value;
            break;
        case 'b2':
            this.b2 = value;
            break;
        case 'rte':
            this.rte = value;
            break;
        case 'nb':
            this.nb = value;
            break;
        case 'o':
            this.o = value;
            break;
    }
};

// to_string - Output the information from independent/dependent vars
PritchardAirfoil.prototype.toString = function() {
    msg = "Airfoil Information:\n";
    msg += "Independent Variables: \n";
    msg += "\tR: " + this.r + "\n";
    msg += "\tCX: " + this.cx + "\n";
    msg += "\tCT: " + this.ct + "\n";
    msg += "\tUCT: " + this.uct*180.0/Math.PI + "\n";
    msg += "\tB1: " + this.b1*180.0/Math.PI + "\n";
    msg += "\tdB1: " + this.db1*180.0/Math.PI + "\n";
    msg += "\tRLE: " + this.rle + "\n";
    msg += "\tB2: " + this.b2*180.0/Math.PI + "\n";
    msg += "\tRTE: " + this.rte + "\n";
    msg += "\tNB: " + this.nb + "\n";
    msg += "\tO: " + this.o + "\n";
    msg += "Dependent Variables: \n";
    msg += "\tPitch: " + this.s() + "\n";
    msg += "\tStagger: " + this.stagger()*180.0/Math.PI  + "\n";
    msg += "\tChord: " + this.c() + "\n";
    msg += "\tZweifel: " + this.zweifel() + "\n";
    msg += "\tSolidity: " + this.solidity() + "\n";
    msg += "\tLift: " + this.lift() + "\n";
    return msg;
};

PritchardAirfoil.prototype.get_params = function(){
    return {
        r: this.r,
        cx: this.cx,
        ct: this.ct,
        uct: this.uct,
        b1: this.b1,
        db1: this.db1,
        rle: this.rle,
        b2: this.b2,
        rte: this.rte,
        nb: this.nb,
        o: this.o
    }
};

PritchardAirfoil.prototype.get_points = function(){
    var pt_arrs = [this.le_pts, this.ss_pts, this.thrt_pts, this.te_pts, this.ps_pts];

    var all_pts = [];
    var current_length = 0;

    // Add LE points in reverse
    all_pts = this.le_pts.slice().reverse();

    // Add SS points
    all_pts = all_pts.concat(this.ss_pts);

    // Add THRT points in reverse
    all_pts = all_pts.concat(this.thrt_pts.slice().reverse());

    // Add TE points in order
    all_pts = all_pts.concat(this.te_pts);

    // Add PS points in reverse
    all_pts = all_pts.concat(this.ps_pts.slice().reverse());

    // Check for duplicate points
    var i = 1;
    while (i < all_pts.length){
        if (dist(all_pts[i-1], all_pts[i]) < 1e-6) {
            all_pts.splice(i, 1);
        } else {
            i++;
        }
    }

    return all_pts;
};

// Other Helper Functions
var cubic_points_from_endpoints = function(num_points, pt1, pt2){
    var d = (Math.tan(pt1.b) + Math.tan(pt2.b))/Math.pow(pt1.x - pt2.x, 2) -
        2*(pt1.y - pt2.y)/Math.pow(pt1.x - pt2.x, 3);
    var c = (pt1.y - pt2.y)/Math.pow(pt1.x - pt2.x, 2) - Math.tan(pt2.b)/(pt1.x - pt2.x) -
        d*(pt1.x + 2*pt2.x);
    var b = Math.tan(pt2.b) - 2*c*pt2.x - 3*d*Math.pow(pt2.x, 2);
    var a = pt2.y - b*pt2.x - c*Math.pow(pt2.x, 2) - d*Math.pow(pt2.x, 3);

    var x_step = (pt2.x - pt1.x)/(num_points - 1);
    var pts = [];
    var new_y, new_x;
    for (i = 0; i < num_points; i++){
        new_x = pt1.x + x_step*i;
        new_y = a + b*new_x + c*Math.pow(new_x, 2) + d*Math.pow(new_x, 3);
        pts.push({x: new_x, y: new_y});
    }
    return pts;
};

var circ_params_from_pts = function(pt1, pt2){
    // pt1 and pt2 must be of form {x: x_val, y: y_val, b: tangent angle}
    var m1, m2, b1, b2, cx, cy, r;
    m1 = -1.0/Math.tan(pt1.b);
    m2 = -1.0/Math.tan(pt2.b);
    b1 = pt1.y - m1*pt1.x;
    b2 = pt2.y - m1*pt2.x;
    cx = (b2-b1)/(m1-m2);
    cy = m1*cx+b1;
    r = Math.sqrt(Math.pow(pt1.x-cx, 2) + Math.pow(pt1.y-cy, 2));
    return [r, cx, cy];
};

var arc_func_from_pts = function(pt1, pt2){
    var r, cx, cy;
    [r, cx, cy] = circ_params_from_pts(pt1, pt2);
    var ang1 = Math.atan2(pt1.y - cy, pt1.x - cx);
    var ang2 = Math.atan2(pt2.y - cy, pt2.x - cx);
    if (ang2 > ang1){
        return arc_funcs(r, cx, cy, ang1, ang2);
    } else {
        return arc_funcs(r, cx, cy, ang2, ang1);
    }
};

var circ_funcs = function(r, cx, cy){
  return {
      x: function(t) {return r*Math.cos(t) + cx },
      y: function(t) {return r*Math.sin(t) + cy }
  };
};

var arc_funcs = function(r, cx, cy, t1, t2){
    return {
        x: function(t) {return r*Math.cos(t*(t2-t1) + t1) + cx },
        y: function(t) {return r*Math.sin(t*(t2-t1) + t1) + cy }
    };
}

// Newton's Method
//a function to compute the data for a line
var line = function(f, a, deltax) {
    var deltay = f(a + deltax) - f(a);
    return [a, f(a), deltax, deltay];
};

//a function for returning the zero
//apply the output of line to this
var xinter = function(a, c, deltax, deltay) {
    return (-c * deltax) / deltay + a;
};

//core Newton's method
var rawNewton = function(guess, f, leftBound, rightBound, dx, minXdist, minYdist, exit) {
    //paste default: 1e-10, 1e-10, 1e-10, 10
    var sequencePoints = [[guess, f(guess)]];
    var lineData, prevGuess, y;
    y = f(guess);
    //newton loop
    for (exit; exit > 0; exit -= 1) {
        lineData = line(f, guess, dx);
        prevGuess = guess;
        y = lineData[1];
        guess = xinter.apply(this, lineData);
        if ((guess < leftBound - dx) || (guess > rightBound + dx)) {
            return [false, "Out of Bounds:" + guess, sequencePoints];
        }
        //add (a,f(a))
        sequencePoints.push([guess, f(guess)]);
        if ((Math.abs(guess - prevGuess) < minXdist) && (Math.abs(y) < minYdist)) {
            return [true, guess, sequencePoints];
        }
    }
    //did not meet the required distances
    return [false, "Did not converge", sequencePoints];
};

//a wrapper for list of defaults
var newton = function(g, f, lb, rb) {
    return rawNewton.call(this, g, f, lb, rb, 1e-10, 1e-10, 1e-10, 10);
};

// Compute distance between two points with .x and .y attributes.
var dist = function(pt1, pt2){
    return Math.sqrt(Math.pow(pt1.x-pt2.x, 2) + Math.pow(pt1.y-pt2.y, 2));
};

export { PritchardAirfoil, default_pritchard_params };
