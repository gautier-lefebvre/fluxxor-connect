[![npm version](https://badge.fury.io/js/fluxxor-connect.svg)](https://badge.fury.io/js/fluxxor-connect)

# fluxxor-connect

Loose implementation of Redux's connect with Fluxxor.

## Installation

```
npm install fluxxor-connect
```

## Usage

### Accessing stores

```js
const React = require('react');

// require the module
const Connect = require('fluxxor-connect');

// create your component
const Component = React.createClass({
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

By default, `Connect` will listen for the `'change'` event of each of the store you provided (provode ?).
To make `Connect` listen to another event, you can pass an additional `event` parameter in the store parameter, like so:

```js
Connect({
  store: 'FOO_STORE',
  state: store => ({
    foo: store.foo
  }),
  event: 'foo:bar'
})(Component);
```

If you want to listen for `'change'` too, you need to specify it.

You can put the same store several times (to listen to different events), or you can put multiple events for the same callback.

```js
Connect({
  store: 'FOO_STORE',
  state: store => ({
    foo: store.foo,
    bar: store.bar
  }),
  event: [ 'foo:bar', 'bar:foo' ]
}, {
  store: 'FOO_STORE',
  state: store => ({
    foobar: store.foobar
  })
})(Component);
```

The name of the keys of the state must be unique, otherwise they will be overwritten.

### Filtering state with your component's props

The `state` method you give to `Connect` can take an additional parameter: the `props` of your component.
You can use it to filter the state from the store using your component's props.

```js
Connect({
  store: 'FOO_STORE',
  state: (store, ownProps) => ({
    foo: store.foo + ownProps.bar
  })
})
```

### Watching props change

If your state depends on your props (see above example), you can specify an additional parameter: `watchedProps`, which will be the name of the props to watch for changes.

```js
Connect({
  store: 'FOO_STORE',
  state: (store, ownProps) => ({
    foo: store.foo + ownProps.bar
  }),
  watchedProps: [ 'bar' ]
})
```

In this example, if the `bar` prop of your component is changed, your `state` function will be called.

The specified props will be fetched using `lodash.get` function, so you can pass nested props paths such as `'foo.bar'` (see [their doc](https://lodash.com/docs/4.17.4#get) for more information).

Additionally, if you only have one prop to watch, you can pass it directly instead of a one-item array (i.e. `watchedProps: 'bar'`).

If you want to watch every prop, you can pass `watchedProps: true` directly.

### State depending on multiple store values

In certain cases you might need to filter store values given values from other stores. For example, you can have a store storing the authenticated user data, and another one storing a list of objects. Now, if you want to filter these objects using the currently authenticated user, you can do this:

```js
@Connect({
  // specify a list of stores instead of just 1 store
  store: [ 'FOO_STORE', 'BAR_STORE' ],

  // specify which events to listen for in each store in the same order
  // for example: here we listen for the 'foo' event in FOO_STORE
  // and the 'bar' and 'foobar' events in BAR_STORE
  event: [ 'foo', [ 'bar', 'foobar' ] ],

  // you get the list of stores as first argument of the state method
  state: ([ fooStore, barStore ], ownProps) => ({
    foobar: fooStore.objs.filter(item => item._id === barStore.obj._id)
  })
})
```

If you want to listen for 'change' in any of the store, leave `null` (or `'change'`) in the store position in the `event: ` property. In this example, we listen for `'change'` in `FOO_STORE` and `'bar'` in `BAR_STORE`:
```js
@Connect({
  store: [ 'FOO_STORE', 'BAR_STORE' ],
  event: [ null, 'bar' ]
})
```

If you want to listen for `'change'` in all stores, you don't have to specify the `event: ` property.

### Accessing flux

After using `Connect` on your component, you can access the `flux` variable using `this.props.flux`.

### Accessing the wrapped component instance

Like `redux`, you can access the wrapped component using `getWrappedInstance()` on the React element.

In the example below, the `Foo` component is wrapped using Connect, and rendered by the `Bar` Component.
`Foo` implements a `getFoo` method, which `Bar` can now access using references.

```js
@Connect({
  // ...
})
class Foo extends React.Component {
  // a public method
  getFoo() {
    return this.foo;
  }

  render() {
    return (
      // ...
    )
  }
}
```

```js
class Bar extends React.Component {
  getFoo() {
    return this.el.getFoo();
  }

  @autobind
  setRef(el) {
    this.el = el.getWrappedInstance();
  }

  render() {
    return (
      <Foo
        ref={this.setRef}
      />
    )
  }
}
```

Do not use this:
```js
<Foo
  ref={el => this.el = el.getWrappedInstance()}
/>
```
See this [React issue](https://github.com/facebook/react/issues/4533).

## Using non-transpiled module

If you are already using tools to minify / transpile your code, you can use the non-transpiled version to reduce bundle size.

```js
const Connect = require('fluxxor-connect/lib/es6');
```
