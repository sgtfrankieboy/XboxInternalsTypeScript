
declare class RSAKey {
    
    constructor();
    setPrivateEx(n: string, e: string, d: string, p: string, q: string, dmp1: string, dmq1: string, coeff: string);
    signStringWithSHA1(dataToSign: string);
    signHashWithSHA1(hashToSign: string);
}