import { Inject, Injectable, InjectionToken } from '@angular/core';
import {Observable, Subject, Subscription} from 'rxjs';
import {isArray, isNull, isString} from 'util';
import * as uuid from 'uuid';
import * as CryptoJS from 'crypto-js';

export const BROWSER_LOCAL_STORAGE = new InjectionToken<Storage>('Browser Local Storage', {
    providedIn: 'root',
    factory: () => localStorage
});

export const BROWSER_SESSION_STORAGE = new InjectionToken<Storage>('Browser Session Storage', {
    providedIn: 'root',
    factory: () => sessionStorage
});

export declare type BrowserStorageType = 'local' | 'session';
export const BROWSER_STORAGE_TYPE_LOCAL: BrowserStorageType = 'local';
export const BROWSER_STORAGE_TYPE_SESSION: BrowserStorageType = 'session';
export const BROWSER_STORAGE_TYPES = [BROWSER_STORAGE_TYPE_LOCAL, BROWSER_STORAGE_TYPE_SESSION];

export interface BrowserStorageOptions {
    default?: BrowserStorageType;
    salt?: string;
    obfuscate?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class BrowserStorageService {

    private storageSubjects: {[key: string]: Subject<any>} = {};
    private storageStates: {[key: string]: Observable<any>} = {};
    private storageSubscriptions: {[key: string]: Subscription} = {};

    private options: BrowserStorageOptions = {
        default: 'local',
        obfuscate: false,
        salt: '96bc32db-8f3d-4f56-b9f8-7c976d068f5c'
    };

    constructor(
        @Inject(BROWSER_LOCAL_STORAGE) public localStorage: Storage,
        @Inject(BROWSER_SESSION_STORAGE) public sessionStorage: Storage) {

        for (const storageType of BROWSER_STORAGE_TYPES) {
            const storage = this.getStorage(storageType);
            for (const key in storage) {
                if (storage.hasOwnProperty(key)) {
                    this._init(key, storageType);
                }
            }
        }
    }

    private _init(key: string, storageType?: BrowserStorageType): Subject<string> {

        const indexKey = this.getIndexKey(key, storageType);

        if (!this.storageSubjects[indexKey]) {
            this.storageSubjects[indexKey] = new Subject<string>();
            this.storageStates[indexKey] = this.storageSubjects[indexKey].asObservable();
            this.storageSubscriptions[indexKey] = this.storageStates[indexKey].subscribe((value) => {
                if (!isString(value)) {
                    value = JSON.stringify(value);
                }
                this.getStorage(storageType).setItem(this.hash(key), this.encrypt(value));
            });
        }
        return this.storageSubjects[indexKey];
    }

    getIndexKey(key: string, storageType?: BrowserStorageType): string {
        return this.getStorageType(storageType) + '_' + key;
    }

    getStorageType(storageType?: BrowserStorageType): BrowserStorageType {
        return storageType ? storageType : this.options.default!;
    }

    getStorage(storageType?: BrowserStorageType): Storage {
        return this.getStorageType(storageType) === 'session' ? this.sessionStorage : this.localStorage;
    }

    configure(options: BrowserStorageOptions = {}) {

        Object.assign(this.options, options);

        return this;
    }

    getFingerprint(storageType?: BrowserStorageType): string {
        const key = 'fingerprint';

        if (!this.has(key)) {
            this.getStorage(storageType).setItem(key, uuid.v4());
        }

        return this.getStorage(storageType).getItem(key)! + this.options.salt;
    }

    has(key: string, storageType?: BrowserStorageType): boolean {
        return !!this.getStorage(storageType).getItem(key);
    }

    getObserver(key: string, storageType?: BrowserStorageType): Observable<any> {
        this._init(key, storageType);
        return this.storageStates[this.getIndexKey(key, storageType)];
    }

    get(key: string, storageType?: BrowserStorageType): any {
        let value = this.getStorage(storageType).getItem(this.hash(key));
        if (!isNull(value)) {
            value = this.decrypt(value);
            try { value = JSON.parse(value); } catch {}
        }
        return value;
    }

    getTyped<T>(key: string, storageType?: BrowserStorageType): T {
        return this.get(key, storageType);
    }

    set(key: string, value: any, storageType?: BrowserStorageType) {
        this._init(key, storageType).next(value);
    }

    trigger(key: string | string[], storageType?: BrowserStorageType) {
        if (!isArray(key)) {
            key = [key];
        }
        for (const k of key) {
            this._init(k, storageType).next(this.get(k, storageType));
        }
    }

    remove(key: string, storageType?: BrowserStorageType) {
        this._init(key, storageType).next(undefined);

        this.getStorage(storageType).removeItem(key);
    }

    clear(storageType?: BrowserStorageType) {
        const storage = this.getStorage(storageType);
        for (const key in storage) {
            if (storage.hasOwnProperty(key)) {
                this.remove(key, storageType);
            }
        }
        storage.clear();
    }

    private hash(text: string): string {
        if (!this.options.obfuscate) { return text; }
        return CryptoJS.HmacSHA256(text, this.getFingerprint()).toString(CryptoJS.enc.Hex);
    }

    private encrypt(text: string): string {
        if (!this.options.obfuscate) { return text; }
        return CryptoJS.AES.encrypt(text, this.getFingerprint()).toString();
    }

    private decrypt(text: string): string {
        if (!this.options.obfuscate) { return text; }
        return CryptoJS.AES.decrypt(text, this.getFingerprint()).toString(CryptoJS.enc.Utf8);
    }
}
