import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Gerçek bir renk çarkı için ana renkleri tanımladık
const RENKLER = [
  { ad: 'Kırmızı', hex: '#FF6B6B' }, // 0 derece
  { ad: 'Turuncu', hex: '#FFAFAF' }, // 60 derece
  { ad: 'Sarı',    hex: '#FFD97D' }, // 120 derece
  { ad: 'Yeşil',   hex: '#A8E6CF' }, // 180 derece
  { ad: 'Mavi',    hex: '#9BF6FF' }, // 240 derece
  { ad: 'Mor',     hex: '#8A7BCA' }, // 300 derece
];

export default function RenkCarkiScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Aurora Işıkları */}
      <View style={[styles.glowOrb, { bottom: -100, left: -50, backgroundColor: '#FFD1C1', width: 400, height: 400 }]} />
      <View style={[styles.glowOrb, { top: -50, right: -100, backgroundColor: '#D4C4FF', width: 350, height: 350 }]} />

      {/* Üst Bar (Geri Dönüş ve Başlık) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#2D2A26" />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>Renk Çarkı</Text>
          <Text style={styles.subtitle}>Görsel uyum rehberi</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        
        {/* GERÇEK GÖRSEL RENK ÇARKI */}
        <View style={styles.wheelContainer}>
          <View style={styles.wheelCenter}>
            <Feather name="aperture" size={40} color="#8A7BCA" />
          </View>

          {/* Matematiği kullanarak renkleri çember şeklinde diziyoruz */}
          {RENKLER.map((renk, index) => {
            const angle = index * 60; // 360 / 6 renk = 60 derece
            return (
              <View 
                key={index} 
                style={[
                  styles.colorOrbWrapper, 
                  { transform: [{ rotate: `${angle}deg` }, { translateY: -100 }] }
                ]}
              >
                <View style={[styles.colorOrb, { backgroundColor: renk.hex, shadowColor: renk.hex }]} />
              </View>
            );
          })}
        </View>

        {/* BİLGİLENDİRME KARTLARI */}
        <View style={styles.infoSection}>
          
          {/* Zıt Renkler */}
          <View style={styles.theoryCard}>
            <View style={styles.cardHeader}>
              <Feather name="git-merge" size={20} color="#FF6B6B" style={{marginRight: 8}} />
              <Text style={styles.theoryName}>Zıt (Tamamlayıcı) Uyum</Text>
            </View>
            <Text style={styles.theoryDesc}>Çarkta birbirinin tam karşısında yer alan renklerdir. Kombine yüksek enerji ve çarpıcı bir kontrast katar.</Text>
            <View style={styles.exampleRow}>
              <View style={[styles.colorDot, {backgroundColor: '#8A7BCA'}]} />
              <Text style={styles.plus}>+</Text>
              <View style={[styles.colorDot, {backgroundColor: '#FFD97D'}]} />
              <Text style={styles.exampleText}>Mor & Sarı</Text>
            </View>
          </View>

          {/* Benzer Renkler */}
          <View style={styles.theoryCard}>
            <View style={styles.cardHeader}>
              <Feather name="git-commit" size={20} color="#3D84A8" style={{marginRight: 8}} />
              <Text style={styles.theoryName}>Benzer (Analog) Uyum</Text>
            </View>
            <Text style={styles.theoryDesc}>Çarkta yan yana duran renklerdir. Gözü yormaz, doğadan ilham alan sakin ve kusursuz bir geçiş sağlar.</Text>
            <View style={styles.exampleRow}>
              <View style={[styles.colorDot, {backgroundColor: '#9BF6FF'}]} />
              <Text style={styles.plus}>+</Text>
              <View style={[styles.colorDot, {backgroundColor: '#8A7BCA'}]} />
              <Text style={styles.exampleText}>Mavi & Mor</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EFFF', paddingTop: 60 },
  glowOrb: { position: 'absolute', borderRadius: 200, opacity: 0.5 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 30, zIndex: 10 },
  backButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  titleWrapper: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#2D2A26' },
  subtitle: { fontSize: 13, color: '#6B6280', marginTop: 2, fontWeight: '600' },
  
  // ÇARK STİLLERİ
  wheelContainer: { width: width, height: 260, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  wheelCenter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: '#B0A8B9', shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  colorOrbWrapper: { position: 'absolute', width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  colorOrb: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },

  // BİLGİ KARTLARI
  infoSection: { paddingHorizontal: 20 },
  theoryCard: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 25, padding: 20, marginBottom: 15, borderWidth: 1.5, borderColor: '#FFF', shadowColor: '#B0A8B9', shadowOpacity: 0.1, shadowRadius: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  theoryName: { fontSize: 17, fontWeight: '800', color: '#2D2A26' },
  theoryDesc: { fontSize: 14, color: '#6B6280', marginBottom: 15, fontWeight: '500', lineHeight: 20 },
  
  exampleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: '#FFF' },
  colorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  plus: { marginHorizontal: 8, color: '#A59B99', fontWeight: '700' },
  exampleText: { marginLeft: 10, fontSize: 13, fontWeight: '800', color: '#2D2A26' }
});