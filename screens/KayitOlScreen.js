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
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { Feather } from '@expo/vector-icons';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#070A12',
  backgroundSoft: '#0B1020',

  card: 'rgba(255,255,255,0.08)',
  cardStrong: 'rgba(255,255,255,0.13)',
  canvas: 'rgba(255,255,255,0.055)',

  border: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.22)',

  text: '#F8F7FF',
  textSoft: '#B9B4C8',
  textMuted: '#7F7895',

  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentSoft: '#C4B5FD',

  pinkGlow: '#EC4899',
  blueGlow: '#38BDF8',

  gold: '#FFD76A',
  danger: '#FB7185',
  success: '#34D399',
  white: '#FFFFFF',
};

export default function KayitOlScreen({ navigation }) {
  const [isim, setIsim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleRegister = async () => {
    if (!isim || !email || !password) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurunuz.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Güvenlik", "Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    setYukleniyor(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(userCredential.user, {
        displayName: isim,
      });

      setYukleniyor(false);

      Alert.alert(
        "Hoş Geldin!",
        `Hesabın başarıyla oluşturuldu ${isim}. ✨`,
        [{ text: "Tamam", onPress: () => navigation.replace('Login') }]
      );
    } catch (error) {
      setYukleniyor(false);
      console.log("Kayıt Hatası:", error.code);

      let mesaj = "Kayıt işlemi sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') mesaj = "Bu e-posta adresi zaten kullanımda.";
      if (error.code === 'auth/invalid-email') mesaj = "Geçersiz bir e-posta adresi girdiniz.";
      if (error.code === 'auth/weak-password') mesaj = "Şifreniz çok zayıf.";

      Alert.alert("Hata", mesaj);
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
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.overline}>CREATE STYLE PROFILE</Text>

          <View style={styles.logoCircle}>
            <View style={styles.logoGlow} />
            <Feather name="aperture" size={39} color={COLORS.accentSoft} />
          </View>

          <Text style={styles.brandName}>Aura</Text>

          <Text style={styles.subtitle}>
            Kişisel AI gardırobunu oluşturmaya başla.
          </Text>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.cardGlow} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Yeni Hesap</Text>
            <Text style={styles.cardSubtitle}>
              Stil profilini oluştur, dolabını akıllı moda sistemine bağla.
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIconBox}>
              <Feather name="user" size={19} color={COLORS.accentSoft} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor={COLORS.textMuted}
              value={isim}
              onChangeText={setIsim}
              autoCapitalize="words"
            />
          </View>

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
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordHint}>
            <Feather name="shield" size={14} color={COLORS.success} />
            <Text style={styles.passwordHintText}>
              Şifren en az 6 karakter olmalı.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, yukleniyor && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={yukleniyor}
            activeOpacity={0.9}
          >
            {yukleniyor ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Feather name="user-plus" size={19} color={COLORS.white} />
                <Text style={styles.registerBtnText}>Kayıt Ol</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Zaten bir hesabın var mı?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginPill}
            activeOpacity={0.85}
          >
            <Text style={styles.loginLink}>Giriş Yap</Text>
            <Feather name="arrow-right" size={14} color={COLORS.accentSoft} />
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

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 54,
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
    bottom: -120,
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
    marginBottom: 22,
    width: width * 0.88,
  },

  overline: {
    fontSize: 12,
    color: COLORS.accentSoft,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 35,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  logoGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.18,
  },

  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1.4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSoft,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  glassCard: {
    width: width * 0.88,
    padding: 24,
    borderRadius: 36,
    backgroundColor: COLORS.card,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.25,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  cardGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.13,
    top: -40,
    right: -40,
  },

  cardHeader: {
    marginBottom: 21,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 19,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: 22,
    paddingHorizontal: 14,
    marginBottom: 15,
    height: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputIconBox: {
    width: 36,
    height: 36,
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

  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -2,
  },

  passwordHintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  registerBtn: {
    backgroundColor: COLORS.accentStrong,
    borderRadius: 23,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexDirection: 'row',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.46,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 9,
  },

  registerBtnDisabled: {
    opacity: 0.62,
  },

  registerBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 8,
  },

  loginContainer: {
    marginTop: 26,
    alignItems: 'center',
  },

  loginText: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },

  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167,139,250,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 19,
  },

  loginLink: {
    color: COLORS.accentSoft,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 7,
  },
});