# fluxxor-connect

Loose implementation of Redux's connect with Fluxxor.

## installation

```
npm install fluxxor-connect
```

## usage

### accessing stores

```
var React = require('react');

// require the module
var Connect = require('fluxxor-connect');

// create your component
var Component = React.createClass({
    render: function () {
        // your 'foo' and 'bar' props are given to your component by the Connect component below.
        return (
            <div>{this.props.foo} {this.props.bar}</div>
        )
    }
});

// connect your component to your stores
// you can put as many stores as you want
// for each store, you must provide a store name and a state function
module.exports = Connect({
    // the name of the store, as given in your Fluxxor configuration
    store: 'FOO_STORE',
    // the state you want to pick from your store
    state: function (store) {
        return {
            foo: store.foo
        };
    }
}, {
    store: 'BAR_STORE',
    state: function (store) {
        return {
            bar: store.bar
        };
    }
})(Component);
```

By default, `Connect` will listen for the `change` event of each of the store you provided (provode ?).
To make `Connect` listen to another event, you can pass an additional `event` parameter in the store parameter, like so:

```
Connect({
    store: 'FOO_STORE',
    state: store => ({
        foo: store.foo
    }),
    event: 'foo:bar'
})(Component);
```

You can put the same store several times (to listen to different events).

The name of the keys of the state must be unique, otherwise they will be overwritten.

### accessing flux

After using `Connect` on your component, you can access the `flux` variable using `this.props.flux`.

## using non-transpiled module

If you are already using tools to minify / transpile your code, you can use the non-transpiled version to reduce bundle size.

`const Connect = require('fluxxor-connect/lib/es6')`
