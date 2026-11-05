import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

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

export default function AyarlarScreen() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('TR');

  const navigation = useNavigation();

  const theme = {
    bg: isDarkMode ? COLORS.background : '#F5EFFF',
    text: isDarkMode ? COLORS.text : '#2D2A26',
    subText: isDarkMode ? COLORS.textSoft : '#6B6280',
    muted: isDarkMode ? COLORS.textMuted : '#8A7BCA',
    glassBg: isDarkMode ? COLORS.card : 'rgba(255,255,255,0.62)',
    glassStrong: isDarkMode ? COLORS.cardStrong : 'rgba(255,255,255,0.82)',
    glassBorder: isDarkMode ? COLORS.border : 'rgba(255,255,255,0.9)',
    orb1: isDarkMode ? COLORS.accentStrong : '#D4C4FF',
    orb2: isDarkMode ? COLORS.pinkGlow : '#FFD1C1',
    orb3: isDarkMode ? COLORS.blueGlow : '#BDEBFF',
    iconColor: isDarkMode ? COLORS.accentSoft : '#8A7BCA',
    activeButton: isDarkMode ? COLORS.accentStrong : '#8A7BCA',
  };

  const cikisYap = () => {
    navigation.replace('Login');
  };

  const ayarSatiri = ({
    icon,
    title,
    subtitle,
    color,
    right,
    onPress,
    danger,
  }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.82 : 1}
      onPress={onPress}
      style={styles.actionRow}
    >
      <View style={styles.settingIconText}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: danger
                ? 'rgba(251,113,133,0.13)'
                : isDarkMode
                  ? 'rgba(167,139,250,0.14)'
                  : '#F1EAFF',
              borderColor: danger
                ? 'rgba(251,113,133,0.22)'
                : isDarkMode
                  ? 'rgba(196,181,253,0.22)'
                  : '#EFE8FF',
            },
          ]}
        >
          <Feather
            name={icon}
            size={21}
            color={color || theme.iconColor}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.settingText,
              { color: danger ? COLORS.danger : theme.text },
            ]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text style={[styles.settingSubText, { color: theme.subText }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right || (
        onPress ? (
          <Feather name="chevron-right" size={21} color={theme.subText} />
        ) : null
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.glowOrb, styles.glowOne, { backgroundColor: theme.orb1 }]} />
      <View style={[styles.glowOrb, styles.glowTwo, { backgroundColor: theme.orb2 }]} />
      <View style={[styles.glowOrb, styles.glowThree, { backgroundColor: theme.orb3 }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.overline, { color: theme.iconColor }]}>
            AURA CONTROL
          </Text>

          <Text style={[styles.title, { color: theme.text }]}>
            {language === 'TR' ? 'Ayarlar' : 'Settings'}
          </Text>

          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {language === 'TR'
              ? 'Uygulama deneyimini, görünümünü ve stil verilerini yönet.'
              : 'Manage your app experience, appearance and style data.'}
          </Text>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.glassBg,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <View style={styles.profileGlow} />

          <View style={styles.avatarBox}>
            <Feather name="user" size={32} color={COLORS.accentSoft} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.profileTitle, { color: theme.text }]}>
              Aura Studio
            </Text>

            <Text style={[styles.profileSubtitle, { color: theme.subText }]}>
              {language === 'TR'
                ? 'AI destekli kişisel gardırop sistemi'
                : 'AI powered personal wardrobe system'}
            </Text>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>AI LENS ACTIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Feather name="zap" size={20} color={COLORS.accentSoft} />
            <Text style={[styles.quickStatTitle, { color: theme.text }]}>
              AI
            </Text>
            <Text style={[styles.quickStatText, { color: theme.subText }]}>
              Stylist
            </Text>
          </View>

          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Feather name="bar-chart-2" size={20} color={COLORS.blueGlow} />
            <Text style={[styles.quickStatTitle, { color: theme.text }]}>
              Data
            </Text>
            <Text style={[styles.quickStatText, { color: theme.subText }]}>
              Analytics
            </Text>
          </View>

          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            <Feather name="shield" size={20} color={COLORS.success} />
            <Text style={[styles.quickStatTitle, { color: theme.text }]}>
              Safe
            </Text>
            <Text style={[styles.quickStatText, { color: theme.subText }]}>
              Profile
            </Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionOverline, { color: theme.iconColor }]}>
            EXPERIENCE
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {language === 'TR' ? 'Deneyim' : 'Experience'}
          </Text>

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {ayarSatiri({
              icon: isDarkMode ? 'moon' : 'sun',
              title: language === 'TR' ? 'Aura Noir Modu' : 'Aura Noir Mode',
              subtitle: language === 'TR'
                ? 'Koyu premium moda arayüzü'
                : 'Dark premium fashion interface',
              right: (
                <Switch
                  trackColor={{
                    false: 'rgba(0,0,0,0.16)',
                    true: COLORS.accentStrong,
                  }}
                  thumbColor={COLORS.white}
                  ios_backgroundColor="rgba(0,0,0,0.18)"
                  onValueChange={() => setIsDarkMode(!isDarkMode)}
                  value={isDarkMode}
                />
              ),
            })}

            <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingIconText}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDarkMode
                        ? 'rgba(167,139,250,0.14)'
                        : '#F1EAFF',
                      borderColor: isDarkMode
                        ? 'rgba(196,181,253,0.22)'
                        : '#EFE8FF',
                    },
                  ]}
                >
                  <Feather name="globe" size={21} color={theme.iconColor} />
                </View>

                <View>
                  <Text style={[styles.settingText, { color: theme.text }]}>
                    {language === 'TR' ? 'Uygulama Dili' : 'App Language'}
                  </Text>

                  <Text style={[styles.settingSubText, { color: theme.subText }]}>
                    TR / EN
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.langToggle,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(0,0,0,0.04)',
                    borderColor: theme.glassBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setLanguage('TR')}
                  activeOpacity={0.85}
                  style={[
                    styles.langBtn,
                    language === 'TR' && {
                      backgroundColor: theme.activeButton,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      {
                        color: language === 'TR'
                          ? COLORS.white
                          : theme.subText,
                      },
                    ]}
                  >
                    TR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setLanguage('EN')}
                  activeOpacity={0.85}
                  style={[
                    styles.langBtn,
                    language === 'EN' && {
                      backgroundColor: theme.activeButton,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      {
                        color: language === 'EN'
                          ? COLORS.white
                          : theme.subText,
                      },
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionOverline, { color: theme.iconColor }]}>
            INTELLIGENCE
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {language === 'TR' ? 'Akıllı Özellikler' : 'Smart Features'}
          </Text>

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {ayarSatiri({
              icon: 'bar-chart-2',
              title: language === 'TR' ? 'Gardırop Analizi' : 'Wardrobe Analytics',
              subtitle: language === 'TR'
                ? 'Dolabındaki renk, kategori ve kullanım istatistikleri'
                : 'Color, category and usage insights',
              onPress: () => navigation.navigate('Istatistik'),
            })}

            <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

            {ayarSatiri({
              icon: 'cpu',
              title: language === 'TR' ? 'Aura Stil Motoru' : 'Aura Style Engine',
              subtitle: language === 'TR'
                ? 'Kombin önerileri ve görsel analiz sistemi aktif'
                : 'Outfit suggestions and visual analysis system active',
              right: (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              ),
            })}

            <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

            {ayarSatiri({
              icon: 'database',
              title: language === 'TR' ? 'Stil Verileri' : 'Style Data',
              subtitle: language === 'TR'
                ? 'Kıyafet profilleri, renk analizi ve vektör kayıtları'
                : 'Clothing profiles, color analysis and vector records',
              right: (
                <Feather name="lock" size={19} color={theme.subText} />
              ),
            })}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionOverline, { color: theme.iconColor }]}>
            ACCOUNT
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {language === 'TR' ? 'Hesap' : 'Account'}
          </Text>

          <View
            style={[
              styles.glassCard,
              {
                backgroundColor: theme.glassBg,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {ayarSatiri({
              icon: 'user',
              title: language === 'TR' ? 'Hesap Yönetimi' : 'Account Management',
              subtitle: language === 'TR'
                ? 'Profil ve hesap tercihleri'
                : 'Profile and account preferences',
              onPress: undefined,
              right: (
                <Feather name="chevron-right" size={21} color={theme.subText} />
              ),
            })}

            <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

            {ayarSatiri({
              icon: 'log-out',
              title: language === 'TR' ? 'Çıkış Yap' : 'Log Out',
              subtitle: language === 'TR'
                ? 'Oturumu kapat ve giriş ekranına dön'
                : 'Close session and return to login',
              color: COLORS.danger,
              danger: true,
              onPress: cikisYap,
              right: null,
            })}
          </View>
        </View>

        <View
          style={[
            styles.versionCard,
            {
              backgroundColor: theme.glassBg,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <Text style={[styles.versionTitle, { color: theme.text }]}>
            Aura v1.0.0
          </Text>

          <Text style={[styles.versionText, { color: theme.subText }]}>
            {language === 'TR'
              ? 'Aura Noir konsepti · AI gardırop deneyimi'
              : 'Aura Noir concept · AI wardrobe experience'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 70,
    paddingBottom: 110,
  },

  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  glowOne: {
    top: -150,
    right: -140,
    width: 380,
    height: 380,
    opacity: 0.42,
  },

  glowTwo: {
    bottom: 80,
    left: -150,
    width: 330,
    height: 330,
    opacity: 0.22,
  },

  glowThree: {
    top: height * 0.42,
    right: -130,
    width: 260,
    height: 260,
    opacity: 0.13,
  },

  header: {
    paddingHorizontal: 26,
    marginBottom: 20,
  },

  overline: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.1,
  },

  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '600',
  },

  profileCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 32,
    borderWidth: 1.2,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  profileGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.accentStrong,
    opacity: 0.16,
    right: -40,
    top: -35,
  },

  avatarBox: {
    width: 70,
    height: 70,
    borderRadius: 26,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  profileTitle: {
    fontSize: 19,
    fontWeight: '900',
  },

  profileSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 4,
  },

  statusPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.24)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },

  statusText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  quickStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
  },

  quickStatCard: {
    flex: 1,
    height: 88,
    borderRadius: 25,
    borderWidth: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickStatTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 7,
  },

  quickStatText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },

  sectionBlock: {
    marginBottom: 22,
  },

  sectionOverline: {
    marginHorizontal: 25,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  sectionTitle: {
    marginHorizontal: 25,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 11,
  },

  glassCard: {
    marginHorizontal: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1.2,
    shadowColor: COLORS.accentStrong,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 12,
  },

  settingIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  settingText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.1,
  },

  settingSubText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 17,
    maxWidth: width * 0.58,
  },

  langToggle: {
    flexDirection: 'row',
    borderRadius: 21,
    padding: 4,
    borderWidth: 1,
  },

  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 17,
  },

  langText: {
    fontWeight: '900',
    fontSize: 13,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 12,
  },

  divider: {
    height: 1,
    width: '100%',
  },

  activeBadge: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  activeBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  versionCard: {
    marginHorizontal: 20,
    marginTop: 2,
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },

  versionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },

  versionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
});