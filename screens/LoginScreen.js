import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#070A12',
  backgroundSoft: '#0B1020',

  card: 'rgba(255,255,255,0.08)',
  cardStrong: 'rgba(255,255,255,0.13)',
  input: 'rgba(255,255,255,0.065)',

  border: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.24)',

  text: '#F8F7FF',
  textSoft: '#B9B4C8',
  textMuted: '#7F7895',

  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentSoft: '#C4B5FD',

  pinkGlow: '#EC4899',
  blueGlow: '#38BDF8',

  danger: '#FB7185',
  success: '#34D399',
  white: '#FFFFFF',
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi giriniz.");
      return;
    }

    setYukleniyor(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (userCredential.user) {
        setYukleniyor(false);
        navigation.replace('AnaUygulama');
      }
    } catch (error) {
      setYukleniyor(false);
      console.log("Giriş Hatası:", error.code);

      let mesaj = "E-posta veya şifre hatalı.";
      if (error.code === 'auth/invalid-email') mesaj = "Geçersiz e-posta formatı.";
      if (error.code === 'auth/user-not-found') mesaj = "Böyle bir kullanıcı bulunamadı.";

      Alert.alert("Giriş Başarısız", mesaj);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={[styles.glowOrb, styles.glowOne]} />
      <View style={[styles.glowOrb, styles.glowTwo]} />
      <View style={[styles.glowOrb, styles.glowThree]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoOuter}>
            <View style={styles.logoGlow} />

            <View style={styles.logoInner}>
              <Text style={styles.logoLetter}>A</Text>
            </View>
          </View>

          <Text style={styles.brandName}>Aura</Text>

          <Text style={styles.brandTagline}>
            AI destekli kişisel stil evrenin.
          </Text>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.cardGlow} />

          <Text style={styles.cardOverline}>WELCOME BACK</Text>

          <Text style={styles.cardTitle}>Giriş Yap</Text>

          <Text style={styles.cardSubtitle}>
            Dolabını, kombinlerini ve stil önerilerini yönetmek için hesabına giriş yap.
          </Text>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Feather name="mail" size={19} color={COLORS.accentSoft} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Feather name="lock" size={19} color={COLORS.accentSoft} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, yukleniyor && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={yukleniyor}
            activeOpacity={0.9}
          >
            {yukleniyor ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Aura’ya Giriş Yap</Text>
                <Feather name="arrow-right" size={19} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.secureRow}>
            <Feather name="shield" size={14} color={COLORS.success} />
            <Text style={styles.secureText}>
              Güvenli oturum sistemi aktif.
            </Text>
          </View>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Henüz Aura hesabın yok mu?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('KayitOl')}
            style={styles.signupButton}
            activeOpacity={0.85}
          >
            <Text style={styles.signupLink}>Yeni hesap oluştur</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 120,
  },

  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    width: 430,
    height: 430,
    top: -170,
    right: -160,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.42,
  },

  glowTwo: {
    width: 360,
    height: 360,
    bottom: -130,
    left: -150,
    backgroundColor: COLORS.pinkGlow,
    opacity: 0.22,
  },

  glowThree: {
    width: 250,
    height: 250,
    top: height * 0.42,
    left: -130,
    backgroundColor: COLORS.blueGlow,
    opacity: 0.12,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
    width: width * 0.88,
  },

  logoOuter: {
    width: 104,
    height: 104,
    borderRadius: 38,
    backgroundColor: COLORS.card,
    borderWidth: 1.3,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  logoGlow: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.22,
  },

  logoInner: {
    width: 66,
    height: 66,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoLetter: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },

  brandName: {
    fontSize: 46,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.5,
  },

  brandTagline: {
    marginTop: 6,
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  loginCard: {
    width: width * 0.88,
    backgroundColor: COLORS.card,
    borderRadius: 38,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 25,
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 13 },
    elevation: 10,
  },

  cardGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.13,
    top: -50,
    right: -45,
  },

  cardOverline: {
    color: COLORS.accentSoft,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 22,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 23,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 62,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputIconBox: {
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
  },

  eyeIcon: {
    padding: 6,
  },

  loginBtn: {
    height: 62,
    borderRadius: 24,
    backgroundColor: COLORS.accentStrong,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.5,
    shadowRadius: 19,
    shadowOffset: { width: 0, height: 9 },
    elevation: 10,
  },

  loginBtnDisabled: {
    opacity: 0.62,
  },

  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },

  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },

  secureText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  signupContainer: {
    marginTop: 28,
    alignItems: 'center',
  },

  signupText: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },

  signupButton: {
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },

  signupLink: {
    color: COLORS.accentSoft,
    fontSize: 14,
    fontWeight: '900',
  },
});