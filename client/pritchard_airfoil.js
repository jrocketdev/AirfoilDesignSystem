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
    db1: 18.0*Math.PI/180.0,
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
}

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

//
// PritchardAirfoil.calc_airfoil = function() {
//
// };

export { PritchardAirfoil, default_pritchard_params };
