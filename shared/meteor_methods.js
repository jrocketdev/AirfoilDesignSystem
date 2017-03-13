/**
 * Created by Jonathan on 3/11/2017.
 */
Meteor.methods({
    // adding new comments
    addAirfoil:function(airfoil_obj){
        console.log("addAirfoil method running!");
        if (Meteor.user()){// we have a user
            airfoil_obj.creator = Meteor.userId();
            var id = Airfoils.insert(airfoil_obj);
            return id;
        }
        return null;
    },
    updateAirfoil:function(airfoil_obj){
        console.log("updateAirfoil method running!");
        if (Meteor.user()){// we have a user
            // Check to make sure the ID is valid.
            var real_airfoil = Airfoils.findOne({_id:airfoil_obj._id});
            if (real_airfoil && airfoil_obj.creator == Meteor.userId()){
                var id = Airfoils.update({_id: airfoil_obj._id}, airfoil_obj);
                return id;
            }
        }
        return null;
    }
})