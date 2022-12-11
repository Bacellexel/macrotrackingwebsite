const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require("../config/auth.js");
const mongoose = require('mongoose');
require('../models/user');
require('../models/meal');
const User = mongoose.model('User');
const Meal = mongoose.model('Meal');  
const fetch = require('node-fetch');


router.get('/', (req, res)=>{
  res.render('login');
});

router.get('/register', (req, res)=>{
  res.render('register');
});

router.get('/dashboard',ensureAuthenticated,(req,res)=>{
  Meal.find({owner:req.user.email}, function(err, meals){
    res.render('dashboard',{
        user: req.user,
        meals:meals
    });
  });
});

router.get('/edit',ensureAuthenticated,(req,res)=>{
  res.render('edit',{
      user: req.user
  });
});

router.get('/food/:foodID', ensureAuthenticated, (req, res) =>{
  Meal.find({owner:req.user.email}, function(err, meals){
  res.render('food', {
    foodEntity:req.params,
    meals:meals,
    user:req.user,
    edit:false
    });
  });
});


router.post('/food/:foodID', ensureAuthenticated, (req,res) =>{
  
})

router.get('/food/:foodID/edit', ensureAuthenticated, (req, res) =>{
  Meal.find({owner:req.user.email}, function(err, meals){
  res.render('food', {
    foodEntity:req.params,
    meals:meals,
    user:req.user,
    edit:true
    });
  });
});

router.get('/addmeal',ensureAuthenticated,(req,res)=>{
  Meal.find({owner:req.user.email}, function(err, meals){
  res.render('addmeal',{
      user:req.user,
      meals:meals
    });
  });
});

router.post('/edit', ensureAuthenticated, (req,res)=>{
  const {totalCalories, weight, height, birthDate, gender, activity, name, goal, proteins, carbs, fats} = req.body;

  User.updateOne(
    {name:req.user.name},
    {$set:{"caloriesTotal":totalCalories, "height":height, "weight":weight, "dateOfBirth":birthDate, "gender":gender, "activity":activity, "name":name, "goal":goal,
             "percentProteins":proteins, "percentCarbs":carbs, "percentFats":fats}}
  )
  .then((obj) => {})
  .catch((err) => {
    console.log('Error: ' + err);
})
res.redirect('dashboard')
});

router.post('/updateMeal', ensureAuthenticated, (req,res)=>{
  const {meal, calories, proteins, carbs, fats, serving} = req.body

  Meal.collection.updateOne(
    {owner:req.user.email, shareID:Number(meal)},
    {$set : {calories:calories, proteins:proteins, carbs:carbs, fats:fats, serving:serving}}
    )
    .then((obj) => {})
    .catch((err) => {
      console.log('Error: ' + err);
    })
    res.redirect('food/' + meal)
})

router.post('/addmeal', ensureAuthenticated, (req,res)=>{

  var { meal, calories, proteins, carbs, fats, removeMeal, customAdd } = req.body;
  var newMeal = new Meal();

  if(meal != '' && calories != ''){
     newMeal = new Meal({
      name:meal,
      calories:calories,
      owner:req.user.email,
      eatenToday:false,
      isPublic:true,
      shareID: Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
    })
  } 
  
  if(customAdd == '') {

  calories = req.user.searchHistory[0].calories;
  proteins = req.user.searchHistory[0].proteins;
  carbs = req.user.searchHistory[0].carbs;
  fats = req.user.searchHistory[0].fats;
  
  newMeal = new Meal({
     name:req.user.searchHistory[0].name,
     calories:Number(calories),
     proteins:Number(proteins),
     carbs:Number(carbs),
     fats:Number(fats),
     owner:req.user.email,
     eatenToday:false,
     servingSize:Number(req.user.searchHistory[0].servingSize),
     servingSizeUnit:req.user.searchHistory[0].servingSizeUnit,
     serving:1,
     shareID: Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
   })
}
  
  if(typeof(removeMeal) != 'undefined'){

    var result = ""

    //Check to remove that ? maybe ?
    if(Array.isArray(removeMeal)){
    result = removeMeal[0].replace(/'/g, '')
    } else {
      result = removeMeal.replace(/'/g, '');
    }

    Meal.collection.deleteOne(
      {"owner": req.user.email, "name":result},
      {$unset: {name: ""}})
  } 
  
  if(newMeal.owner != 'Unknown'){
    newMeal.save();
  }

  res.redirect('/addmeal')
});

router.post('/searchmeal', ensureAuthenticated, (req,res)=>{

  var {searchmeal} = req.body;
  var isBranded = false;

  if(searchmeal == "") { res.redirect('addmeal') }

  if(searchmeal.includes("-b")){
    isBranded = true;
    searchmeal = searchmeal.replace('-b', '');
  }

  const key="api key"
  var id = 0;
  

// Find meal by a SharedID
if(!isNaN(searchmeal)){
    Meal.find({shareID:searchmeal}, function(err, result){
      User.updateOne(
        {"email": req.user.email},
        {$set : {searchHistory:result}}
      )
      .then((obj) => {
        res.redirect('/addmeal')
      })
      .catch((err)=> {
        console.log(err)
        res.redirect('/addmeal')   
      })
    })
  }
  // Check if a meal in the local database match
  if (isNaN(searchmeal)){
    Meal.find({name: { $regex : new RegExp(searchmeal, "i") }}, function(err, result){
      if(result.length > 0){
      User.updateOne(
        {"email": req.user.email},
        {$set : {searchHistory:result}}
      )
      .then((obj) => {
        res.redirect('/addmeal')
      })
      .catch((err)=> {
        console.log(err)
        res.redirect('/addmeal')   
      })
    }
    //else we query spooncular's API for data on non-branded items if no match
    else if(!isBranded) {
  
    const api_url = 
    `https://api.spoonacular.com/food/search?apiKey=${encodeURIComponent(key)}&query=${encodeURIComponent(searchmeal)}&number=2`
   
     fetch(api_url)
    .then(response => response.json())
    .then(data => {
      if(data.searchResults[5].results[0] != undefined){
       id = data.searchResults[5].results[0].id;
      } else {
        id = req.user.searchHistory[0].id;
      }
    })
    .then(() => {
      const api_url2 = 
      `https://api.spoonacular.com/food/ingredients/${encodeURIComponent(id)}/information?apiKey=${encodeURIComponent(key)}&amount=1`
    
      fetch(api_url2)
      .then(response=> response.json())
      .then(data => {
        var searchedFood = new Meal({
          name: data.name,
          owner: req.user.email,
          calories: data.nutrition.nutrients.find(nutrient => nutrient.name == "Calories").amount,
          proteins: data.nutrition.nutrients.find(nutrient => nutrient.name == "Protein").amount,
          carbs: data.nutrition.nutrients.find(nutrient => nutrient.name == "Carbohydrates").amount,
          fats: data.nutrition.nutrients.find(nutrient => nutrient.name == "Fat").amount,
          servingSize: data.nutrition.weightPerServing.amount,
          servingUnit: data.nutrition.weightPerServing.unit,
          vitaminE: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin E").amount,
          netCarbohydrates: data.nutrition.nutrients.find(nutrient => nutrient.name == "Net Carbohydrates").amount,
          sugar: data.nutrition.nutrients.find(nutrient => nutrient.name == "Sugar").amount,
          alcohol: data.nutrition.nutrients.find(nutrient => nutrient.name == "Alcohol").amount,
          vitaminB3: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B3").amount,
          magnesium: data.nutrition.nutrients.find(nutrient => nutrient.name == "Magnesium").amount,
          vitaminB1: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B1").amount,
          vitaminB12: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B12").amount,
          vitaminA: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin A").amount,
          vitaminK: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin K").amount,
          zinc: data.nutrition.nutrients.find(nutrient => nutrient.name == "Zinc").amount,
          manganese: data.nutrition.nutrients.find(nutrient => nutrient.name == "Manganese").amount,
          polyUnsaturatedFat: data.nutrition.nutrients.find(nutrient => nutrient.name == "Poly Unsaturated Fat").amount,
          saturatedFat: data.nutrition.nutrients.find(nutrient => nutrient.name == "Saturated Fat").amount,
          phosphorus: data.nutrition.nutrients.find(nutrient => nutrient.name == "Phosphorus").amount,
          potassium: data.nutrition.nutrients.find(nutrient => nutrient.name == "Potassium").amount,
          vitaminB6: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B6").amount,
          calcium: data.nutrition.nutrients.find(nutrient => nutrient.name == "Calcium").amount,
          vitaminC: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin C").amount,
          vitaminB5: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B5").amount,
          caffeine: data.nutrition.nutrients.find(nutrient => nutrient.name == "Caffeine").amount,
          iron: data.nutrition.nutrients.find(nutrient => nutrient.name == "Iron").amount,
          cholesterol: data.nutrition.nutrients.find(nutrient => nutrient.name == "Cholesterol").amount,
          fiber: data.nutrition.nutrients.find(nutrient => nutrient.name == "Fiber").amount,
          sodium: data.nutrition.nutrients.find(nutrient => nutrient.name == "Sodium").amount,
          vitaminD: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin D").amount,
          fluoride: data.nutrition.nutrients.find(nutrient => nutrient.name == "Fluoride").amount,
          copper: data.nutrition.nutrients.find(nutrient => nutrient.name == "Copper").amount,
          vitaminB2: data.nutrition.nutrients.find(nutrient => nutrient.name == "Vitamin B2").amount,
          shareID: Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
        })
        User.updateOne(
          {"email": req.user.email},
          {$set : {searchHistory:searchedFood}}
        )
        .then((obj) => {
          res.redirect('/addmeal')
        })
        .catch((err)=> {
          console.log(err)
        })
      })
    })
  
  } else{
    
      const api_url = 
      `https://api.spoonacular.com/food/menuItems/search?apiKey=${encodeURIComponent(key)}&query=${searchmeal}&number=1`
    
      fetch(api_url)
      .then(response=> response.json())
      .then(data => {
        
        id = data.menuItems[0].id;
    
          const api_url2 = 
          `https://api.spoonacular.com/food/menuItems/${encodeURIComponent(id)}?apiKey=${encodeURIComponent(key)}`
          fetch(api_url2)
          .then(response => response.json())
          .then(data => {

            var searchedFood = new Meal({
              name: data.title,
              owner: req.user.email,
              calories: data.nutrition.nutrients.find(nutrient => nutrient.name == "Calories").amount,
              proteins: data.nutrition.nutrients.find(nutrient => nutrient.name == "Protein").amount,
              carbs: data.nutrition.nutrients.find(nutrient => nutrient.name == "Carbohydrates").amount,
              fats: data.nutrition.nutrients.find(nutrient => nutrient.name == "Fat").amount,
              servingSize: data.servings.size,
              servingSizeUnit: data.servings.unit,
              netCarbohydrates: data.nutrition.nutrients.find(nutrient => nutrient.name == "Net Carbohydrates").amount,
              sugar: data.nutrition.nutrients.find(nutrient => nutrient.name == "Sugar").amount,
              saturatedFat: data.nutrition.nutrients.find(nutrient => nutrient.name == "Saturated Fat").amount,
              cholesterol: data.nutrition.nutrients.find(nutrient => nutrient.name == "Cholesterol").amount,
              fiber: data.nutrition.nutrients.find(nutrient => nutrient.name == "Fiber").amount,
              sodium: data.nutrition.nutrients.find(nutrient => nutrient.name == "Sodium").amount,
              shareID: Math.floor(Math.random() * Math.floor(Math.random() * Date.now()))
            })

            User.updateOne(
              {"email": req.user.email},
              {$set : {searchHistory:searchedFood}}
            )
            .then((obj) => {
              res.redirect('/addmeal')
            })
            .catch((err)=> {
              console.log(err)
    
            })
          })
      })
    }
  })
}
});

router.post('/dashboard', ensureAuthenticated, (req,res)=>{

const {mealEaten} = req.body;

var eatenCount = 0;
var meal = new Meal();

Meal.find({name:mealEaten, owner:req.user.email}, function(err, result){
  if(err){
    console.log(err);
  } else {
    eatenCount = result[0].eatenCount;
    meal = result[0];
    User.updateOne(
      {"email" : req.user.email},
      {$inc : {"todayCalories":meal.calories, "todayProteins":meal.proteins, "todayCarbs":meal.carbs, "todayFats":meal.fats}}
    )
    .then((obj) => {
      
    })
    .catch((err) => {
      console.log('Error: ' + err);
    })
  }
})
Meal.updateOne(
  {"name" : mealEaten, "owner": req.user.email},
  {$set : {"eatenToday": true}, $inc : {"eatenCount": 1}}
)
.then(function(err, result){})



res.redirect('dashboard');
})

router.post('/purge', ensureAuthenticated, (req,res)=>{
  Meal.collection.drop();
  User.updateOne(
    {"name": req.user.name},
    {$set : {"todayCalories":0, "todayProteins":0, "todayCarbs":0, "todayFats":0}}
  ).then(function(err, result){})
    
  res.redirect('/dashboard')
})
module.exports = router; 

