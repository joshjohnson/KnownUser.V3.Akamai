/// <reference path="types/akamai.d.ts"/>
import { Cookies } from 'cookies';
import { IConnectorContextProvider, ICryptoProvider, IEnqueueTokenProvider, IHttpRequest, IHttpResponse } from 'queueit-knownuser';
import { AkamaiCryptoProvider } from './akamaiCryptoProvider.js';
import { AkamaiEnqueueTokenProvider } from './akamaiEnqueueTokenProvider.js';
import { Settings } from './QueueITHelpers';

export class AkamaiContextProvider implements IConnectorContextProvider {
    private _httpRequest: IHttpRequest;
    private _httpResponse: IHttpResponse;
    private _enqueueTokenProvider: IEnqueueTokenProvider;
    private _cryptoProvider: ICryptoProvider;

    public constructor(akamiNativeRequest: any, akamaiNativeResponse: any) {
        this._httpRequest = new AkamaiHttpRequest(akamiNativeRequest);
        this._httpResponse = new AkamaiHttpResponse(akamaiNativeResponse);
        this._cryptoProvider = new AkamaiCryptoProvider();
    }

    public getHttpRequest() {
        return this._httpRequest;
    }

    public getHttpResponse() {
        return this._httpResponse;
    }

    public setEnqueueTokenProvider(
        setting: Settings,
        validityTime: Number,
        clientIp?: string,
        customData?: any) {

        if (!setting || validityTime < -1) {
            this._enqueueTokenProvider = null;
            return;
        }

        this._enqueueTokenProvider = new AkamaiEnqueueTokenProvider(
            setting,
            validityTime,
            clientIp,
            customData
        );
    }

    public getEnqueueTokenProvider() {
        if (!this._enqueueTokenProvider) {
            throw new Error('EnqueueTokenProvider is not set!');
        }
        return this._enqueueTokenProvider;
    }

    public getCryptoProvider() {
        return this._cryptoProvider;
    }
}

class AkamaiHttpRequest {
    constructor(private _akamiNativeRequest: any) {
    }

    public getUserAgent() {
        return this.getHeader("user-agent");
    }

    public getHeader(headerNameArg: string) {
        return (this._akamiNativeRequest.getHeader(headerNameArg) || []).toString();
    }

    public getAbsoluteUri() {
        return `${this._akamiNativeRequest.scheme}://${this._akamiNativeRequest.host}${this._akamiNativeRequest.url}`;
    }

    public getUserHostAddress() {
        return this._akamiNativeRequest.getVariable('PMUSER_TRUE_CLIENT_IP');
    }

    public getCookieValue(cookieKey: string) {
        try {
            let cookies = new Cookies(this._akamiNativeRequest.getHeader('Cookie'));
            let cookieValue = cookies.get(cookieKey);
            if (cookieValue)
                return decodeURIComponent(cookieValue);

        } catch {
            return undefined;
        }
    }

    public getRequestBodyAsString() {
        return "";
    }
}

class AkamaiHttpResponse {
    constructor(private _akamiNativeRequest: any) {
    }

    public setCookie(cookieName: string, cookieValue: string, domain: string, expiration, httpOnly: boolean, isSecure: boolean) {

        // expiration is in secs, but Date needs it in milisecs
        let expirationDate = new Date(expiration * 1000);

        let setCookieString = `${cookieName}=${encodeURIComponent(cookieValue)}; expires=${expirationDate.toUTCString()};`;
        if (domain) {
            setCookieString += ` domain=${domain};`;
        }

        if (httpOnly) {
            setCookieString += " HttpOnly;"
        }

        if (isSecure) {
            setCookieString += " Secure;"
        }

        setCookieString += " path=/";
        this._akamiNativeRequest.storeCookie(setCookieString);
    }
}
