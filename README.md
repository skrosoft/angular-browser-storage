# Angular browser storage

The project include a BrowserStorageService that allow you to manage browser storage, subscribe to variable changes using an observer.
Variables are automatically encrypted / serialized and un-serialized / decrypted by this service.

## Getting started

Inject the service to your class

```typescript
import {BrowserStorageOptions, BrowserStorageService} from 'angular-browser-storage';

class Demo {
    constructor(private storage: BrowserStorageService) {
        // ...
    }
}
```

Optionally, in your bootstrap class (example: app.component), configure the service:

```typescript
// options: BrowserStorageOptions
this.storage.configure(options);
```

Options are the following:

**default:**

The default browser storage type (local storage or session storage), the default value is 'local'. Possible values are 'local' or 'session'

**salt:**

A salt string to encrypt storage variables. It is highly recommended to use your own salt, however, a salt will be provided by default.

**obfuscate:**

A boolean that indicate if variable should be encrypted or not. By default, the value is false and the storage is not encrypted. It is recommended to use true in production mode. You should never store sensible information in the browser storage, be aware that client side is never safe.

## Data manipulations

### Set a variable

Using the default storage type:

```typescript
this.storage.set('key', 'value');
```

You can optionally use another storage type:

```typescript
this.storage.set('key', 'value', 'session');
this.storage.set('key', 'value', 'local');
```

Value as object will be automatically serialized to JSON.

### Get a variable

Using the default storage type:

```typescript
const key:string = this.storage.get('key');
const user:User = this.storage.get('user');
const user = this.storage.getTyped<User>('user');
```

You can optionally use another storage type:

```typescript
const key:string = this.storage.get('key', 'session');
const user:User = this.storage.get('user');
const user = this.storage.getTyped<User>('user');
```

Value will be automatically un-serialized to object.

### Remove a variable

Using the default storage type:

```typescript
this.storage.remove('key');
```

You can optionally use another storage type:

```typescript
this.storage.remove('key', 'session');
```

You can clear all variable of the default storage:

```typescript
this.storage.clear();
```

Or, you can clear all variable of a specified storage:

```typescript
this.storage.clear('session');
```

### Check if a storage has a variable

Using the default storage type:

```typescript
if (this.storage.has('key')){
    console.log('The default storage has the variable "key".');
}else{
    console.log('The default storage has no variable "key".');
}
```

You can optionally use another storage type:

```typescript
if (this.storage.has('key', 'session')){
    console.log('The session storage has the variable "key".');
}else{
    console.log('The session storage has no variable "key".');
}
```

### Subscribe to changes

You can subscribe to any variable using an observer.

```typescript
ngOnInit() {
    this.subscription: Observer = this.storage.getObserver('key').subscribe((key) => {
      // use the key ...
    });
    
    this.storage.trigger('key');
}
```

You can use the trigger function to trigger an observer. It's useful to detect variable after the page has been loaded.
