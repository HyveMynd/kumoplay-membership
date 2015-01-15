/**
* Created by Andres Monroy (HyveMynd) on 9/19/14.
*/
var assert = require("assert");
var db = require('revision');
var Registration = require('../lib/registration');
var Auth = require('../lib/authentication');
var should = require('should');

describe('Authentication', function () {
    var reg = {};
    var auth = {};

    before(function (done) {
        db.connect({db:"membership"}, function (err, db) {
            reg = new Registration(db);
            auth = new Auth(db);
            done();
        });
    });

    describe("a valid login", function(){

        var authResult = {};
        before(function(done){
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "test@test.com", password: "password", confirm: "password", firstName: "asd", lastName: "dsa"}, function (err, regResult) {
                    assert.ok(regResult.success);
                    auth.authenticate({email: 'test@test.com', password: 'password'}, function (err, result) {
                        assert.ok(err === null, err);
                        authResult = result;
                        done();
                    });
                });
            });
        });

        it("is successful", function () {
            authResult.success.should.be.true;
        });
        it("return a user", function () {
            should.exist(authResult.user);
        });
        it("updates the user stats", function () {
            authResult.user.signInCount.should.equal(2);
        });
        it("updates the signon dates", function () {
            should.exist(authResult.user.lastLoginAt);
            should.exist(authResult.user.currentLoginAt);
        });
    });

    describe("empty email", function(){

        var authResult = {};
        before(function(done){
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "test@test.com", password: "password", confirm: "password", firstName: "asd", lastName: "dsa"}, function (err, regResult) {
                    assert.ok(regResult.success);
                    auth.authenticate({email: null, password: 'password'}, function (err, result) {
                        assert.ok(err === null, err);
                        authResult = result;
                        done();
                    });
                });
            });
        });

        it("is not successful", function () {
            authResult.success.should.be.false;
        });
        it("returns invalid login message", function () {
            authResult.message.should.equal("Invalid email or password");
        });
    });

    describe("empty password", function(){

        var authResult = {};
        before(function(done){
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "test@test.com", password: "password", confirm: "password", firstName: "asd", lastName: "dsa"}, function (err, regResult) {
                    assert.ok(regResult.success);
                    auth.authenticate({email: 'test@test.com', password: null}, function (err, result) {
                        assert.ok(err === null, err);
                        authResult = result;
                        done();
                    });
                });
            });
        });

        it("is not successful", function () {
            authResult.success.should.be.false;
        });
        it("returns invalid login message", function () {
            authResult.message.should.equal("Invalid email or password");
        });
    });

    describe("password does not match", function(){

        var authResult = {};
        before(function(done){
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "test@test.com", password: "password", confirm: "password", firstName: "asd", lastName: "dsa"}, function (err, regResult) {
                    assert.ok(regResult.success);
                    auth.authenticate({email: 'test@test.com', password: 'word'}, function (err, result) {
                        assert.ok(err === null, err);
                        authResult = result;
                        done();
                    });
                });
            });
        });
        it("is not successful", function () {
            authResult.success.should.be.false;
        });
        it("returns invalid login message", function () {
            authResult.message.should.equal("Invalid email or password");
        });
    });

    describe("email not found", function(){
        var authResult = {};
        before(function(done){
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "test@test.com", password: "password", confirm: "password", firstName: "asd", lastName: "dsa"}, function (err, regResult) {
                    assert.ok(regResult.success);
                    auth.authenticate({email: 'asd@asd.com', password: 'password'}, function (err, result) {
                        assert.ok(err === null, err);
                        authResult = result;
                        done();
                    });
                });
            });
        });
        it("is not successful", function () {
            authResult.success.should.be.false;
        });
        it("returns invalid login message", function () {
            authResult.message.should.equal("Invalid email or password");
        });
    });


});