import { describe, expect, it } from 'vitest';
import { isPrivateHostname } from '@/index.js';

describe('isPrivateHostname', () => {
  describe('localhost', () => {
    it('should return true for localhost', () => {
      expect(isPrivateHostname('localhost')).toBe(true);
    });

    it('should return true for localhost.localdomain', () => {
      expect(isPrivateHostname('localhost.localdomain')).toBe(true);
    });
  });

  describe('IPv4 loopback', () => {
    it('should return true for 127.0.0.1', () => {
      expect(isPrivateHostname('127.0.0.1')).toBe(true);
    });

    it('should return true for 127.0.0.0', () => {
      expect(isPrivateHostname('127.0.0.0')).toBe(true);
    });

    it('should return true for 127.255.255.255', () => {
      expect(isPrivateHostname('127.255.255.255')).toBe(true);
    });
  });

  describe('IPv6 loopback', () => {
    it('should return true for ::1', () => {
      expect(isPrivateHostname('::1')).toBe(true);
    });

    it('should return true for [::1]', () => {
      expect(isPrivateHostname('[::1]')).toBe(true);
    });
  });

  describe('private IPv4 ranges', () => {
    describe('10.0.0.0/8', () => {
      it('should return true for 10.0.0.0', () => {
        expect(isPrivateHostname('10.0.0.0')).toBe(true);
      });

      it('should return true for 10.255.255.255', () => {
        expect(isPrivateHostname('10.255.255.255')).toBe(true);
      });

      it('should return true for 10.50.100.200', () => {
        expect(isPrivateHostname('10.50.100.200')).toBe(true);
      });
    });

    describe('172.16.0.0/12', () => {
      it('should return true for 172.16.0.0', () => {
        expect(isPrivateHostname('172.16.0.0')).toBe(true);
      });

      it('should return true for 172.31.255.255', () => {
        expect(isPrivateHostname('172.31.255.255')).toBe(true);
      });

      it('should return true for 172.20.10.5', () => {
        expect(isPrivateHostname('172.20.10.5')).toBe(true);
      });

      it('should return false for 172.15.255.255 (below range)', () => {
        expect(isPrivateHostname('172.15.255.255')).toBe(false);
      });

      it('should return false for 172.32.0.0 (above range)', () => {
        expect(isPrivateHostname('172.32.0.0')).toBe(false);
      });
    });

    describe('192.168.0.0/16', () => {
      it('should return true for 192.168.0.0', () => {
        expect(isPrivateHostname('192.168.0.0')).toBe(true);
      });

      it('should return true for 192.168.255.255', () => {
        expect(isPrivateHostname('192.168.255.255')).toBe(true);
      });

      it('should return true for 192.168.1.1', () => {
        expect(isPrivateHostname('192.168.1.1')).toBe(true);
      });

      it('should return false for 192.169.0.0', () => {
        expect(isPrivateHostname('192.169.0.0')).toBe(false);
      });
    });

    describe('169.254.0.0/16 (link-local)', () => {
      it('should return true for 169.254.0.0', () => {
        expect(isPrivateHostname('169.254.0.0')).toBe(true);
      });

      it('should return true for 169.254.255.255', () => {
        expect(isPrivateHostname('169.254.255.255')).toBe(true);
      });

      it('should return true for 169.254.100.50', () => {
        expect(isPrivateHostname('169.254.100.50')).toBe(true);
      });
    });
  });

  describe('public addresses', () => {
    it('should return false for public IPv4 addresses', () => {
      expect(isPrivateHostname('8.8.8.8')).toBe(false);
      expect(isPrivateHostname('1.1.1.1')).toBe(false);
      expect(isPrivateHostname('93.184.216.34')).toBe(false);
    });

    it('should return false for domain names', () => {
      expect(isPrivateHostname('example.com')).toBe(false);
      expect(isPrivateHostname('google.com')).toBe(false);
      expect(isPrivateHostname('sub.domain.example.org')).toBe(false);
    });
  });
});
