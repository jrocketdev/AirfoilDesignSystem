/**
 * Created by Jonathan on 3/11/2017.
 */
Template.navbar.helpers({
    personal_airfoils:function() {
        if (!Meteor.user()){
            // User is not logged in.
            return [];
        }

        var airfoil_list = Airfoils.find({creator: Meteor.userId()});
        return airfoil_list;
    }
})